use super::initialize_rocket;
use migration::{Migrator, MigratorTrait};
use rocket::local::asynchronous::Client;
use sea_orm::{Database, DatabaseConnection};
use tokio::sync::broadcast;

pub async fn init_server(db: Option<DatabaseConnection>) -> anyhow::Result<Client> {
    let conn = match db {
        Some(db) => db,
        None => {
            // Make a fresh DB
            db_conn().await?
        }
    };

    let update_feed = broadcast::channel(1).0;
    let rocket = initialize_rocket(conn, update_feed).await.unwrap();
    let client = Client::tracked(rocket)
        .await
        .expect("valid rocket instance");

    Ok(client)
}

pub async fn db_conn() -> anyhow::Result<DatabaseConnection> {
    let conn = Database::connect("sqlite::memory:").await?;
    Migrator::refresh(&conn).await?;
    Ok(conn)
}
