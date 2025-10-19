use anyhow::Result;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection};
use uuid::Uuid;

pub use entity::task::{ActiveModel as TaskActiveModel, Entity as Task, Model as TaskModel};
pub use entity::task_project::{ActiveModel as TaskProjectActiveModel, Model as TaskProjectModel};

pub enum Status {
    Todo,
    InProgress,
    Complete,
}

impl Status {
    pub fn to_string(&self) -> String {
        match self {
            Status::Todo => "todo".to_string(),
            Status::InProgress => "in_progress".to_string(),
            Status::Complete => "complete".to_string(),
        }
    }
}

pub async fn create_task(
    db: &DatabaseConnection,
    title: String,
    status: Status,
) -> Result<TaskModel> {
    let task = TaskActiveModel {
        id: ActiveValue::Set(Uuid::new_v4()),
        title: ActiveValue::Set(title),
        status: ActiveValue::Set(status.to_string()),
        ..Default::default()
    };
    let task = task.insert(db).await?;

    Ok(task)
}

pub async fn add_to_project(
    db: &DatabaseConnection,
    task_id: &Uuid,
    project_id: &Uuid,
) -> Result<TaskProjectModel> {
    let tp = TaskProjectActiveModel {
        project_id: ActiveValue::Set(project_id.clone()),
        task_id: ActiveValue::Set(task_id.clone()),
        ..Default::default()
    };

    let tp = tp.insert(db).await?;

    Ok(tp)
}

pub async fn create_task_in_project(
    db: &DatabaseConnection,
    title: String,
    status: Status,
    project_id: &Uuid,
) -> Result<TaskModel> {
    let task = create_task(db, title, status).await?;
    add_to_project(db, &task.id, project_id).await?;
    Ok(task)
}
