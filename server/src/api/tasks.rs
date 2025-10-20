use rocket::serde::json::Json;
use rocket::{Route, State};
use sea_orm::{DatabaseConnection, EntityTrait};
// use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::task::{self, Task, TaskModel};
use crate::result::{Result, error_response};

// TODO: patch tasks/:id/:field (edit a field)
// TODO: delete tasks/:id/:field (clear a field)
// TODO: get tasks?query= (search tasks by query text)

// GET /tasks/:id
//
// Get task with the given ID
#[get("/tasks/<id>")]
async fn get_task(id: &str, db: &State<DatabaseConnection>) -> Result<Json<TaskModel>> {
    let id = Uuid::parse_str(id).unwrap_or(Uuid::nil());
    let task = Task::find_by_id(id).one(db.inner()).await?;
    match task {
        Some(t) => Ok(Json(t)),
        // TODO: this should 404
        None => Err(error_response(format!("Task with id {id:?} not found!"))),
    }
}

pub fn routes() -> Vec<Route> {
    routes![get_task]
}

#[cfg(test)]
mod test {
    use crate::models::task::{self, TaskModel};
    use crate::test_helpers;
    use rocket::http::Status;
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
}
