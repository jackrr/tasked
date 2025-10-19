use super::initialize_rocket;
use migration::{Migrator, MigratorTrait};
use rocket::local::asynchronous::Client;
use sea_orm::{Database, DatabaseConnection};
use std::time::SystemTime;
use uuid::Uuid;

pub async fn init_server(db: Option<DatabaseConnection>) -> anyhow::Result<Client> {
    let conn = match db {
        Some(db) => db,
        None => {
            // Make a fresh DB
            db_conn().await?
        }
    };

    let rocket = initialize_rocket(conn).await.unwrap();
    let client = Client::tracked(rocket)
        .await
        .expect("valid rocket instance");

    Ok(client)
}

pub async fn db_conn() -> anyhow::Result<DatabaseConnection> {
    // TODO: establish "teardown" pattern to remove temporary db file
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)?
        .as_millis();
    let nonce = Uuid::new_v4();
    let db_uri = format!("sqlite://../tmp/test_db_{now}_{nonce}.sqlite?mode=rwc");
    // Log DB URI, can be helpful for debugging failed tests
    println!("DB URI {db_uri}");
    let conn = Database::connect(db_uri).await?;
    Migrator::refresh(&conn).await?;
    Ok(conn)
}
