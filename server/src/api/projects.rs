use crate::result::Result;
use entity::project::{
    ActiveModel as ProjectActiveModel, Entity as Project, Model as ProjectModel,
};
use rocket::serde::json::Json;
use rocket::{Route, State};
use sea_orm::entity::*;
use sea_orm::{ActiveValue, DatabaseConnection, EntityTrait};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
struct CreateProjectPayload<'r> {
    title: &'r str,
}

#[get("/projects")]
async fn projects(db: &State<DatabaseConnection>) -> Result<Json<Vec<ProjectModel>>> {
    let projects = Project::find().all(db.inner()).await?;
    Ok(Json(projects))
}

#[post("/projects", format = "json", data = "<project>")]
async fn create_project(
    project: Json<CreateProjectPayload<'_>>,
    db: &State<DatabaseConnection>,
) -> Result<Json<ProjectModel>> {
    let project = ProjectActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        title: ActiveValue::Set(project.title.to_owned()),
        ..Default::default()
    };
    let project = project.insert(db.inner()).await?;

    Ok(Json(project))
}

pub fn routes() -> Vec<Route> {
    routes![projects, create_project]
}

#[cfg(test)]
mod test {
    use super::ProjectModel;
    use crate::test::init_server;
    use rocket::http::{ContentType, Status};
    use serde_json;

    #[rocket::async_test]
    async fn test_get_projects() {
        let client = init_server().await.unwrap();
        let response = client.get(uri!(super::projects)).dispatch().await;
        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let projects: Vec<ProjectModel> =
            serde_json::from_str(&response_str).expect("Empty list of projects");
        assert_eq!(projects.len(), 0);
    }

    #[rocket::async_test]
    async fn test_create_project() {
        let client = init_server().await.unwrap();
        let response = client
            .post(uri!(super::create_project))
            .header(ContentType::JSON)
            .body(
                r##"{
                  "title": "A new project!"
                }"##,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let project: ProjectModel = serde_json::from_str(&response_str).expect("The Project");
        assert_eq!(project.title, "A new project!");
    }
}
