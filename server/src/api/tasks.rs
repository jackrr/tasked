use rocket::serde::json::Json;
use rocket::{Route, State};
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};

use super::helpers::parse_uuid;
use super::subscription::{EntityType, FeedWriter, UpdateEvent, UpdateKind};
use crate::models::project::{Project, ProjectModel};
use crate::models::task::{self, EditTaskPayload, Task, TaskModel};
use crate::result::{Result, error_response};

// Get task with the given ID
#[get("/tasks/<id>")]
async fn get_task(id: &str, db: &State<DatabaseConnection>) -> Result<Json<TaskModel>> {
    let id = parse_uuid(id)?;
    let task = Task::find_by_id(id).one(db.inner()).await?;
    match task {
        Some(t) => Ok(Json(t)),
        // TODO: this should 404
        None => Err(error_response(format!("Task with id {id:?} not found!"))),
    }
}

// Get projects belonging to task with the given id
#[get("/tasks/<id>/projects")]
async fn get_task_projects(
    id: &str,
    db: &State<DatabaseConnection>,
) -> Result<Json<Vec<ProjectModel>>> {
    let id = parse_uuid(id)?;
    let tasks = Project::find()
        .has_related(Task, task::Column::Id.eq(id))
        .all(db.inner())
        .await?;

    Ok(Json(tasks))
}

// Delete task with the given ID
#[delete("/tasks/<id>")]
async fn delete_task(
    id: &str,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<()> {
    let id = parse_uuid(id)?;
    Task::delete_by_id(id).exec(db.inner()).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Destroy,
        EntityType::Task,
        id.clone(),
    )?;
    Ok(())
}

// Edit field<>value pair(s) on task
#[patch("/tasks/<id>", format = "json", data = "<task>")]
async fn edit_task(
    id: &str,
    task: Json<EditTaskPayload<'_>>,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<Json<TaskModel>> {
    let id = parse_uuid(id)?;
    let task = task::edit_task(db.inner(), &id, task).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Task,
        id.clone(),
    )?;
    Ok(Json(task))
}

// Clear fields listed in query param
#[post("/tasks/<id>/clear_fields?<fields>")]
async fn clear_task_fields(
    id: &str,
    fields: Vec<&str>,
    db: &State<DatabaseConnection>,
    feed: &State<FeedWriter>,
) -> Result<Json<TaskModel>> {
    let id = parse_uuid(id)?;
    let fields = task::ClearableField::from_field_strs(fields)?;
    let task = task::clear_fields(db.inner(), &id, fields).await?;
    UpdateEvent::broadcast(
        feed.inner(),
        UpdateKind::Update,
        EntityType::Task,
        id.clone(),
    )?;
    Ok(Json(task))
}

// Search tasks by "search" text in query
#[get("/tasks?<search>")]
async fn search_tasks(
    search: &str,
    db: &State<DatabaseConnection>,
) -> Result<Json<Vec<TaskModel>>> {
    let tasks = Task::find()
        .filter(
            Condition::any()
                .add(task::Column::Title.contains(search))
                .add(task::Column::Description.contains(search)),
        )
        .order_by_desc(task::Column::CreatedAt)
        .all(db.inner())
        .await?;

    Ok(Json(tasks))
}

pub fn routes() -> Vec<Route> {
    routes![
        get_task,
        get_task_projects,
        delete_task,
        edit_task,
        clear_task_fields,
        search_tasks
    ]
}

#[cfg(test)]
mod test {
    use crate::models::project::{self, ProjectModel};
    use crate::models::task::{self, TaskActiveModel, TaskModel};
    use crate::test_helpers;
    use rocket::http::{ContentType, Status};
    use sea_orm::prelude::Date;
    use sea_orm::{ActiveModelTrait, ActiveValue};
    use serde_json;

    #[rocket::async_test]
    async fn test_get_task() {
        let db = test_helpers::db_conn().await.unwrap();

        let task = task::create_task(&db, "Task 1".to_string(), task::Status::InProgress)
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::get_task(task.id.to_string())))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let res: TaskModel = serde_json::from_str(&response_str).expect("A task");
        assert_eq!(res.id, task.id);
    }

    #[rocket::async_test]
    async fn test_get_task_projects() {
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
        project::create_project(&db, "Other project".to_string())
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::get_task_projects(task.id.to_string())))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let res: Vec<ProjectModel> = serde_json::from_str(&response_str).expect("Project list");
        assert_eq!(res.len(), 1);
        assert_eq!(res[0].id, project.id);
    }

    #[rocket::async_test]
    async fn test_edit_task() {
        let db = test_helpers::db_conn().await.unwrap();
        let task = task::create_task(&db, "A task".to_string(), task::Status::Todo)
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .patch(uri!(super::edit_task(task.id.to_string())))
            .header(ContentType::JSON)
            .body(
                r#"{
                  "title": "New Name!!",
                  "description": "A description!",
                  "status": "in_progress",
                  "due_date": "2025-12-01"
                }"#,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let task: TaskModel = serde_json::from_str(&response_str).expect("The Task");
        assert_eq!(task.title, "New Name!!");
        assert_eq!(task.description, Some("A description!".to_string()));
        assert_eq!(task.status, task::Status::InProgress.to_string());
        assert_eq!(
            task.due_date.unwrap(),
            Date::parse_from_str("2025-12-01", "%Y-%m-%d").unwrap()
        );
    }

    #[rocket::async_test]
    async fn test_partial_edit_task() {
        let db = test_helpers::db_conn().await.unwrap();
        let task = task::create_task(&db, "A task".to_string(), task::Status::Todo)
            .await
            .unwrap();
        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .patch(uri!(super::edit_task(task.id.to_string())))
            .header(ContentType::JSON)
            .body(
                r#"{
                  "description": "A description!",
                  "due_date": "2025-12-01"
                }"#,
            )
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let task: TaskModel = serde_json::from_str(&response_str).expect("The Task");
        assert_eq!(task.title, "A task");
        assert_eq!(task.description, Some("A description!".to_string()));
        assert_eq!(task.status, task::Status::Todo.to_string());
        assert_eq!(
            task.due_date.unwrap(),
            Date::parse_from_str("2025-12-01", "%Y-%m-%d").unwrap()
        );
    }

    #[rocket::async_test]
    async fn test_clear_task_fields() {
        let db = test_helpers::db_conn().await.unwrap();
        let task = task::create_task(&db, "A task".to_string(), task::Status::Todo)
            .await
            .unwrap();
        let mut task: TaskActiveModel = task.into();
        task.due_date = ActiveValue::Set(Some(Date::from_ymd_opt(2025, 12, 1).unwrap()));
        task.description = ActiveValue::Set(Some("A description!".to_string()));
        let task = task.update(&db).await.unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .post(uri!(super::clear_task_fields(
                task.id.to_string(),
                vec!["due_date"]
            )))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let task: TaskModel = serde_json::from_str(&response_str).expect("The Task");
        assert_eq!(task.title, "A task");
        assert_eq!(task.due_date, None);
        assert_eq!(task.description, Some("A description!".to_string()));
        assert_eq!(task.status, task::Status::Todo.to_string());
    }

    #[rocket::async_test]
    async fn test_delete_task() {
        let db = test_helpers::db_conn().await.unwrap();

        let task = task::create_task(&db, "Task 1".to_string(), task::Status::InProgress)
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::delete_task(task.id.to_string())))
            .dispatch()
            .await;

        // FIXME: add ability to access db after API call to verify side effects
        assert_eq!(response.status(), Status::Ok);
    }

    #[rocket::async_test]
    async fn test_search_tasks() {
        let db = test_helpers::db_conn().await.unwrap();

        let flip = task::create_task(
            &db,
            "Invert everything in universe".to_string(),
            task::Status::InProgress,
        )
        .await
        .unwrap();

        let nothingness = task::create_task(
            &db,
            "Comprehend nothingness".to_string(),
            task::Status::InProgress,
        )
        .await
        .unwrap();

        let cohere = task::create_task(
            &db,
            "Collapse everything unto itself".to_string(),
            task::Status::InProgress,
        )
        .await
        .unwrap();

        let other = task::create_task(&db, "Go on a walk".to_string(), task::Status::InProgress)
            .await
            .unwrap();

        let client = test_helpers::init_server(Some(db)).await.unwrap();
        let response = client
            .get(uri!(super::search_tasks("thing")))
            .dispatch()
            .await;
        assert_eq!(response.status(), Status::Ok);
        let response_str = response.into_string().await.unwrap();
        let tasks: Vec<TaskModel> =
            serde_json::from_str(&response_str).expect("Task search results");
        for task in [flip, nothingness, cohere] {
            assert!(tasks.contains(&task));
        }
        assert!(!tasks.contains(&other))
    }
}
