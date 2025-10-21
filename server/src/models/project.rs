use anyhow::Result;
pub use entity::project::{
    ActiveModel as ProjectActiveModel, Column::Id, Entity as Project, Model as ProjectModel,
};
use rocket::serde::json::Json;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection};
use serde::Deserialize;
use uuid::Uuid;

pub async fn create_project(db: &DatabaseConnection, title: String) -> Result<ProjectModel> {
    let proj = ProjectActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        title: ActiveValue::Set(title),
        ..Default::default()
    };
    let proj = proj.insert(db).await?;

    Ok(proj)
}

#[derive(Deserialize)]
pub struct EditProjectPayload<'r> {
    title: Option<&'r str>,
    description: Option<&'r str>,
}

pub async fn edit_project(
    db: &DatabaseConnection,
    id: &Uuid,
    payload: Json<EditProjectPayload<'_>>,
) -> Result<ProjectModel> {
    let proj = ProjectActiveModel {
        id: ActiveValue::Set(id.clone()),
        title: match payload.title {
            Some(title) => ActiveValue::Set(title.to_owned()),
            None => ActiveValue::NotSet,
        },
        description: match payload.description {
            Some(description) => ActiveValue::Set(Some(description.to_owned())),
            None => ActiveValue::NotSet,
        },
        ..Default::default()
    };
    let proj = proj.update(db).await?;

    Ok(proj)
}
