use anyhow::{Error, Result};
use rocket::serde::json::Json;
use sea_orm::prelude::Date;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait};
use serde::Deserialize;
use std::collections::HashSet;
use uuid::Uuid;

pub use entity::task::{
    ActiveModel as TaskActiveModel, Column, Entity as Task, Model as TaskModel,
};
pub use entity::task_project::{
    ActiveModel as TaskProjectActiveModel, Entity as TaskProject, Model as TaskProjectModel,
};

#[derive(Debug)]
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

    pub fn parse(s: &str) -> Result<Self> {
        let res = match s {
            "todo" => Status::Todo,
            "in_progress" => Status::InProgress,
            "complete" => Status::Complete,
            _ => return Err(Error::msg(format!("Invalid task status {s}"))),
        };

        Ok(res)
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

#[derive(Deserialize)]
pub struct EditTaskPayload<'r> {
    title: Option<&'r str>,
    description: Option<&'r str>,
    status: Option<&'r str>,
    due_date: Option<&'r str>,
}

pub async fn edit_task(
    db: &DatabaseConnection,
    id: &Uuid,
    payload: Json<EditTaskPayload<'_>>,
) -> Result<TaskModel> {
    let task = TaskActiveModel {
        id: ActiveValue::Set(id.clone()),
        title: match payload.title {
            Some(title) => ActiveValue::Set(title.to_owned()),
            None => ActiveValue::NotSet,
        },
        description: match payload.description {
            Some(description) => ActiveValue::Set(Some(description.to_owned())),
            None => ActiveValue::NotSet,
        },
        status: match payload.status {
            // Parse and re-stringify to validate
            Some(status) => ActiveValue::Set(Status::parse(status)?.to_string()),
            None => ActiveValue::NotSet,
        },
        due_date: match payload.due_date {
            Some(due_date) => ActiveValue::Set(Some(Date::parse_from_str(due_date, "%Y-%m-%d")?)),
            None => ActiveValue::NotSet,
        },
        ..Default::default()
    };
    let task = task.update(db).await?;

    Ok(task)
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum ClearableField {
    DueDate,
    Description,
}

impl ClearableField {
    pub fn from_field_strs(field_strs: Vec<&str>) -> Result<HashSet<Self>> {
        let mut results = HashSet::with_capacity(2);
        for s in field_strs {
            match Self::from(s) {
                Ok(v) => results.insert(v),
                Err(e) => return Err(e),
            };
        }

        Ok(results)
    }

    pub fn from(s: &str) -> Result<Self> {
        let res = match s {
            "due_date" => ClearableField::DueDate,
            "description" => ClearableField::Description,
            _ => return Err(Error::msg(format!("Field not clearable on task: {s}"))),
        };

        Ok(res)
    }
}

pub async fn clear_fields(
    db: &DatabaseConnection,
    id: &Uuid,
    fields: HashSet<ClearableField>,
) -> Result<TaskModel> {
    let description = if fields.contains(&ClearableField::Description) {
        ActiveValue::Set(None)
    } else {
        ActiveValue::NotSet
    };
    let due_date = if fields.contains(&ClearableField::DueDate) {
        ActiveValue::Set(None)
    } else {
        ActiveValue::NotSet
    };

    let task = TaskActiveModel {
        id: ActiveValue::Set(id.clone()),
        title: ActiveValue::NotSet,
        status: ActiveValue::NotSet,
        description: description,
        due_date: due_date,
        ..Default::default()
    };

    let task = task.update(db).await?;
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

pub async fn remove_from_project(
    db: &DatabaseConnection,
    task_id: &Uuid,
    project_id: &Uuid,
) -> Result<()> {
    let tp = TaskProjectActiveModel {
        project_id: ActiveValue::Set(project_id.clone()),
        task_id: ActiveValue::Set(task_id.clone()),
        ..Default::default()
    };
    let _ = TaskProject::delete(tp).exec(db).await?;
    Ok(())
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
