use rocket::serde::json::Json;
use rocket::{Route, State};
use sea_orm::{DatabaseConnection, EntityTrait, FromQueryResult, raw_sql};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::project::{self, Project, ProjectModel};
use crate::result::Result;

// GET /projects
//
// Get task counts for projects with ids specified in query
#[get("/projects")]
async fn projects(db: &State<DatabaseConnection>) -> Result<Json<Vec<ProjectModel>>> {
    let projects = Project::find().all(db.inner()).await?;
    Ok(Json(projects))
}

// GET /projects/stats
//
// Get task counts for projects with ids specified in query
#[derive(Debug, PartialEq, Deserialize, Serialize, FromQueryResult)]
struct ProjectStats {
    id: Uuid,
    completed_tasks: u32,
    total_tasks: u32,
}

#[get("/projects/stats?<ids>")]
async fn project_stats(
    ids: Vec<&str>,
    db: &State<DatabaseConnection>,
) -> Result<Json<Vec<ProjectStats>>> {
    let ids: Vec<Uuid> = ids
        .into_iter()
        .map(|id| Uuid::parse_str(id).unwrap_or(Uuid::nil()))
        .collect();

    let stats: Vec<ProjectStats> = ProjectStats::find_by_statement(raw_sql!(
        Sqlite,
        r#"SELECT p.id as id, count(distinct ct.id) as completed_tasks, count(distinct t.id) as total_tasks
           FROM project p
           LEFT JOIN task_project ctp on ctp.project_id = p.id
           LEFT JOIN task_project tp on tp.project_id = p.id
           LEFT JOIN task ct on ctp.task_id = ct.id and ct.status = 'complete'
           LEFT JOIN task t on tp.task_id = t.id
           WHERE "p"."id" IN ({..ids})
           GROUP BY p.id
        "#
    ))
    .all(db.inner())
    .await?;

    Ok(Json(stats))
}

// POST /projects
//
// Create a new project with the given title
#[derive(Deserialize)]
struct CreateProjectPayload<'r> {
    title: &'r str,
}

#[post("/projects", format = "json", data = "<project>")]
async fn create_project(
    project: Json<CreateProjectPayload<'_>>,
    db: &State<DatabaseConnection>,
) -> Result<Json<ProjectModel>> {
    let project = project::create_project(db.inner(), project.title.to_owned()).await?;

    Ok(Json(project))
}

pub fn routes() -> Vec<Route> {
    routes![projects, create_project, project_stats]
}

#[cfg(test)]
mod test {
    use crate::models::project::{self, ProjectModel};
    use crate::models::task;
    use crate::test_helpers;
    use rocket::http::{ContentType, Status};
    use serde_json;

    use super::ProjectStats;

    #[rocket::async_test]
    async fn test_get_projects() {
        let client = test_helpers::init_server(None).await.unwrap();
        let response = client.get(uri!(super::projects)).dispatch().await;
        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let projects: Vec<ProjectModel> =
            serde_json::from_str(&response_str).expect("Empty list of projects");
        assert_eq!(projects.len(), 0);
    }

    #[rocket::async_test]
    async fn test_create_project() {
        let client = test_helpers::init_server(None).await.unwrap();
        let response = client
            .post(uri!(super::create_project))
            .header(ContentType::JSON)
            .body(
                r#"{
                  "title": "A new project!"
                }"#,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let project: ProjectModel = serde_json::from_str(&response_str).expect("The Project");
        assert_eq!(project.title, "A new project!");
    }

    #[rocket::async_test]
    async fn test_project_stats() {
        let db = test_helpers::db_conn().await.unwrap();

        let proj_two_complete = project::create_project(&db, "Project 2/2 completed".to_string())
            .await
            .unwrap();
        task::create_task_in_project(
            &db,
            "Task 1".to_string(),
            task::Status::Complete,
            &proj_two_complete.id,
        )
        .await
        .unwrap();
        task::create_task_in_project(
            &db,
            "Task 2".to_string(),
            task::Status::Complete,
            &proj_two_complete.id,
        )
        .await
        .unwrap();

        let proj_one_complete = project::create_project(&db, "Project 1/2 completed".to_string())
            .await
            .unwrap();
        task::create_task_in_project(
            &db,
            "Task 1".to_string(),
            task::Status::Todo,
            &proj_one_complete.id,
        )
        .await
        .unwrap();
        task::create_task_in_project(
            &db,
            "Task 2".to_string(),
            task::Status::Complete,
            &proj_one_complete.id,
        )
        .await
        .unwrap();

        let empty_project = project::create_project(&db, "Empty Project".to_string())
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::project_stats(vec![
                proj_two_complete.id.to_string(),
                proj_one_complete.id.to_string(),
                empty_project.id.to_string(),
            ])))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let res: Vec<ProjectStats> = serde_json::from_str(&response_str).expect("List of stats");
        assert_eq!(res.len(), 3);
    }
}
