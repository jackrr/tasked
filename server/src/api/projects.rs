use rocket::serde::json::Json;
use rocket::{Route, State};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, FromQueryResult, QueryOrder, raw_sql};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::project::{self, EditProjectPayload, Project, ProjectModel};
use crate::models::task::{self, Task, TaskModel};
use crate::result::{Result, error_response};

use super::helpers::parse_uuid;
use super::subscription::{EntityType, FeedWriter, UpdateEvent, UpdateKind};

// Get task counts for projects with ids specified in query
#[get("/projects")]
async fn projects(db: &State<DatabaseConnection>) -> Result<Json<Vec<ProjectModel>>> {
    let projects = Project::find()
        .order_by_desc(project::Column::CreatedAt)
        .all(db.inner())
        .await?;
    Ok(Json(projects))
}

// Get task counts for projects with ids specified in query
#[derive(Debug, PartialEq, Deserialize, Serialize, FromQueryResult)]
struct ProjectStats {
    id: Uuid,
    complete: u32,
    in_progress: u32,
    todo: u32,
    total: u32,
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
        r#"SELECT p.id as id,
             count(distinct ct.id) as complete,
             count(distinct it.id) as in_progress,
             count(distinct tt.id) as todo,
             count(distinct t.id) as total
           FROM project p
           -- complete tasks
           LEFT JOIN task_project ctp on ctp.project_id = p.id
           LEFT JOIN task ct on ctp.task_id = ct.id and ct.status = 'complete'
           -- todo tasks
           LEFT JOIN task_project ttp on ttp.project_id = p.id
           LEFT JOIN task tt on ttp.task_id = tt.id and tt.status = 'todo'
           -- in_progress tasks
           LEFT JOIN task_project itp on itp.project_id = p.id
           LEFT JOIN task it on itp.task_id = it.id and it.status = 'in_progress'
           LEFT JOIN task_project tp on tp.project_id = p.id
           LEFT JOIN task t on tp.task_id = t.id
           WHERE "p"."id" IN ({..ids})
           GROUP BY p.id, p.created_at
           ORDER BY p.created_at
        "#
    ))
    .all(db.inner())
    .await?;

    Ok(Json(stats))
}

// Create a new project with the given title
#[derive(Deserialize)]
struct CreateProjectPayload<'r> {
    title: &'r str,
}

#[post("/projects", format = "json", data = "<project>")]
async fn create_project(
    project: Json<CreateProjectPayload<'_>>,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<Json<ProjectModel>> {
    let project = project::create_project(db.inner(), project.title.to_owned()).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Create,
        EntityType::Project,
        project.id.clone(),
    )?;
    Ok(Json(project))
}

// Get project with the given ID
#[get("/projects/<id>")]
async fn get_project(id: &str, db: &State<DatabaseConnection>) -> Result<Json<ProjectModel>> {
    let id = parse_uuid(id)?;
    let project = Project::find_by_id(id).one(db.inner()).await?;
    match project {
        Some(p) => Ok(Json(p)),
        // TODO: this should 404
        None => Err(error_response(format!("Project with id {id:?} not found!"))),
    }
}

// FIXME: support newline characters in descriptions !?
// Edit field<>value pair(s) on project
#[patch("/projects/<id>", format = "json", data = "<project>")]
async fn edit_project(
    id: &str,
    project: Json<EditProjectPayload<'_>>,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<Json<ProjectModel>> {
    let id = parse_uuid(id)?;
    let project = project::edit_project(db.inner(), &id, project).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Project,
        id.clone(),
    )?;
    Ok(Json(project))
}

// Delete project with the given ID
#[delete("/projects/<id>")]
async fn delete_project(
    id: &str,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<()> {
    let id = parse_uuid(id)?;
    Project::delete_by_id(id).exec(db.inner()).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Destroy,
        EntityType::Project,
        id.clone(),
    )?;
    Ok(())
}

// Get tasks belonging to project with the given id
#[get("/projects/<id>/tasks")]
async fn get_project_tasks(
    id: &str,
    db: &State<DatabaseConnection>,
) -> Result<Json<Vec<TaskModel>>> {
    let id = parse_uuid(id)?;
    let tasks = Task::find()
        .has_related(Project, project::Column::Id.eq(id))
        .order_by_asc(task::Column::CreatedAt)
        .all(db.inner())
        .await?;

    Ok(Json(tasks))
}

// Create a new task and add to project with the given id
#[derive(Deserialize)]
struct CreateTaskPayload<'r> {
    title: &'r str,
}

#[post("/projects/<id>/tasks", format = "json", data = "<task>")]
async fn create_task_in_project(
    id: &str,
    task: Json<CreateTaskPayload<'_>>,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<Json<TaskModel>> {
    let id = parse_uuid(id)?;
    let task =
        task::create_task_in_project(db.inner(), task.title.to_owned(), task::Status::Todo, &id)
            .await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Create,
        EntityType::Task,
        task.id.clone(),
    )?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Project,
        id.clone(),
    )?;
    Ok(Json(task))
}

// Associate a task to a project.
// Preserves any pre-existing project associations for the task.
#[post("/projects/<project_id>/add_task?<task_id>")]
async fn add_task_to_project(
    project_id: &str,
    task_id: &str,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<()> {
    let project_id = parse_uuid(project_id)?;
    let task_id = parse_uuid(task_id)?;
    task::add_to_project(db.inner(), &task_id, &project_id).await?;

    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Project,
        project_id.clone(),
    )?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Task,
        task_id.clone(),
    )?;

    Ok(())
}

// Dissociate a task from a project.
// Preserves any other project associations.
#[post("/projects/<project_id>/remove_task?<task_id>")]
async fn remove_task_from_project(
    project_id: &str,
    task_id: &str,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<()> {
    let project_id = parse_uuid(project_id)?;
    let task_id = parse_uuid(task_id)?;
    task::remove_from_project(db.inner(), &task_id, &project_id).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Project,
        project_id.clone(),
    )?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Task,
        task_id.clone(),
    )?;
    Ok(())
}

pub fn routes() -> Vec<Route> {
    routes![
        projects,
        create_project,
        edit_project,
        delete_project,
        project_stats,
        get_project,
        get_project_tasks,
        create_task_in_project,
        add_task_to_project,
        remove_task_from_project
    ]
}

#[cfg(test)]
mod test {
    use crate::models::project::{self, ProjectModel};
    use crate::models::task::{self, TaskModel};
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
    async fn test_edit_project() {
        let db = test_helpers::db_conn().await.unwrap();
        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .patch(uri!(super::edit_project(project.id.to_string())))
            .header(ContentType::JSON)
            .body(
                r#"{
                  "title": "New Name!!",
                  "description": "A description!"
                }"#,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let project: ProjectModel = serde_json::from_str(&response_str).expect("The Project");
        assert_eq!(project.title, "New Name!!");
        assert_eq!(project.description, Some("A description!".to_string()));
    }

    #[rocket::async_test]
    async fn test_edit_project_single_field() {
        let db = test_helpers::db_conn().await.unwrap();
        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .patch(uri!(super::edit_project(project.id.to_string())))
            .header(ContentType::JSON)
            .body(
                r#"{
                  "description": "A description!"
                }"#,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let project: ProjectModel = serde_json::from_str(&response_str).expect("The Project");
        assert_eq!(project.title, "A project");
        assert_eq!(project.description, Some("A description!".to_string()));
    }

    #[rocket::async_test]
    async fn test_create_task_in_project() {
        let db = test_helpers::db_conn().await.unwrap();
        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();

        let response = client
            .post(uri!(super::create_task_in_project(project.id.to_string())))
            .header(ContentType::JSON)
            .body(
                r#"{
                  "title": "A new task!"
                }"#,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let project: TaskModel = serde_json::from_str(&response_str).expect("The task");
        assert_eq!(project.title, "A new task!");
    }

    #[rocket::async_test]
    async fn test_add_task_to_project() {
        let db = test_helpers::db_conn().await.unwrap();
        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let task = task::create_task(&db, "Task".to_string(), task::Status::InProgress)
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();

        let response = client
            .post(uri!(super::add_task_to_project(
                project.id.to_string(),
                task.id.to_string()
            )))
            .dispatch()
            .await;

        // FIXME: add ability to access db after API call to verify side effects
        assert_eq!(response.status(), Status::Ok);
    }

    #[rocket::async_test]
    async fn test_remove_task_from_project() {
        let db = test_helpers::db_conn().await.unwrap();
        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let task = task::create_task_in_project(
            &db,
            "Task".to_string(),
            task::Status::InProgress,
            &project.id,
        )
        .await
        .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();

        let response = client
            .post(uri!(super::remove_task_from_project(
                project.id.to_string(),
                task.id.to_string()
            )))
            .dispatch()
            .await;

        // FIXME: add ability to access db after API call to verify side effects
        assert_eq!(response.status(), Status::Ok);
    }

    #[rocket::async_test]
    async fn test_get_project() {
        let db = test_helpers::db_conn().await.unwrap();

        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::get_project(project.id.to_string())))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let res: ProjectModel = serde_json::from_str(&response_str).expect("A project");
        assert_eq!(res.id, project.id);
    }

    #[rocket::async_test]
    async fn test_get_project_tasks() {
        let db = test_helpers::db_conn().await.unwrap();

        let project = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();
        let task = task::create_task_in_project(
            &db,
            "Task 1".to_string(),
            task::Status::Complete,
            &project.id,
        )
        .await
        .unwrap();

        // Not in project
        task::create_task(&db, "Other task".to_string(), task::Status::Complete)
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::get_project_tasks(project.id.to_string())))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let res: Vec<TaskModel> = serde_json::from_str(&response_str).expect("Task list");
        assert_eq!(res.len(), 1);
        assert_eq!(res[0].id, task.id);
    }

    #[rocket::async_test]
    async fn test_project_stats() {
        let db = test_helpers::db_conn().await.unwrap();

        let proj_two_complete = project::create_project(&db, "Project 0/0/2".to_string())
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

        let proj_one_complete = project::create_project(&db, "Project 1/0/1".to_string())
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

        let empty_project = project::create_project(&db, "Project 0/0/0".to_string())
            .await
            .unwrap();

        let in_progress_proj = project::create_project(&db, "Project 0/1/0".to_string())
            .await
            .unwrap();
        task::create_task_in_project(
            &db,
            "Task 4".to_string(),
            task::Status::InProgress,
            &in_progress_proj.id,
        )
        .await
        .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::project_stats(vec![
                proj_two_complete.id.to_string(),
                proj_one_complete.id.to_string(),
                empty_project.id.to_string(),
                in_progress_proj.id.to_string()
            ])))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let res: Vec<ProjectStats> = serde_json::from_str(&response_str).expect("List of stats");
        assert_eq!(res.len(), 4);
    }

    #[rocket::async_test]
    async fn test_delete_project() {
        let db = test_helpers::db_conn().await.unwrap();

        let p = project::create_project(&db, "A project".to_string())
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::delete_project(p.id.to_string())))
            .dispatch()
            .await;

        // FIXME: add ability to access db after API call to verify side effects
        assert_eq!(response.status(), Status::Ok);
    }
}
