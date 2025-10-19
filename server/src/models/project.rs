use anyhow::Result;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection};
use uuid::Uuid;

pub use entity::project::{
    ActiveModel as ProjectActiveModel, Entity as Project, Model as ProjectModel,
};

pub async fn create_project(db: &DatabaseConnection, title: String) -> Result<ProjectModel> {
    let proj = ProjectActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        title: ActiveValue::Set(title),
        ..Default::default()
    };
    let proj = proj.insert(db).await?;

    Ok(proj)
}
