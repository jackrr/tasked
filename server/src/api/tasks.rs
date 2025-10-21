use rocket::serde::json::Json;
use rocket::{Route, State};
use sea_orm::{DatabaseConnection, EntityTrait};

use super::helpers::parse_uuid;
use crate::models::task::{self, EditTaskPayload, Task, TaskModel};
use crate::result::{Result, error_response};

// GET /tasks/:id
//
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

// DELETE /tasks/:id
//
// Delete task with the given ID
#[delete("/tasks/<id>")]
async fn delete_task(id: &str, db: &State<DatabaseConnection>) -> Result<()> {
    let id = parse_uuid(id)?;
    Task::delete_by_id(id).exec(db.inner()).await?;
    Ok(())
}

// PATCH tasks/:id
//
// Edit field<>value pair(s) on task
#[patch("/tasks/<id>", format = "json", data = "<task>")]
async fn edit_task(
    id: &str,
    task: Json<EditTaskPayload<'_>>,
    db: &State<DatabaseConnection>,
) -> Result<Json<TaskModel>> {
    let id = parse_uuid(id)?;
    let task = task::edit_task(db.inner(), &id, task).await?;
    Ok(Json(task))
}

// // TODO: delete tasks/:id/:field (clear a field)
// // TODO: get tasks?query= (search tasks by query text)

pub fn routes() -> Vec<Route> {
    routes![get_task, delete_task]
}

#[cfg(test)]
mod test {
    use crate::models::task::{self, TaskModel};
    use crate::test_helpers;
    use rocket::http::{ContentType, Status};
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
    async fn test_edit_task() {
        let db = test_helpers::db_conn().await.unwrap();
        let project = task::create_task(&db, "A task".to_string(), task::Status::Todo)
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
                  "due_date": "2025-12-01",
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
        // FIXME: date stuff!!
        // assert_eq!(task.due_date, Some("A description!".to_string()));
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
}
