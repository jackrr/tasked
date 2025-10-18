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

#[get("/")]
async fn projects(db: &State<DatabaseConnection>) -> Result<Json<Vec<ProjectModel>>> {
    let projects = Project::find().all(db.inner()).await?;
    Ok(Json(projects))
}

#[post("/", format = "json", data = "<project>")]
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
