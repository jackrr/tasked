#[macro_use]
extern crate rocket;

use dotenv::dotenv;
use migration::{Migrator, MigratorTrait};
use rocket::{Build, Rocket};
use rocket_cors::{AllowedOrigins, CorsOptions};
use sea_orm::{Database, DatabaseConnection};
use std::env;

mod api;
use api::projects;

mod result;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

async fn initialize_rocket(db_conn: DatabaseConnection) -> anyhow::Result<Rocket<Build>> {
    let rocket = rocket::build()
        .manage(db_conn)
        .mount("/", routes![index])
        .mount("/", projects::routes());

    Ok(rocket)
}

#[rocket::main]
async fn main() -> anyhow::Result<()> {
    // Initialize dotenv in nonprod
    #[cfg(debug_assertions)]
    dotenv().ok();

    let db_uri = env::var("DATABASE_URL").unwrap();
    let conn = Database::connect(db_uri).await?;
    Migrator::up(&conn, None).await?;
    let rocket = initialize_rocket(conn).await?;

    let allowed_origins = env::var("ALLOWED_ORIGINS").unwrap();
    let allowed_origins: Vec<&str> = allowed_origins.split(",").collect();
    let cors = CorsOptions::default().allowed_origins(AllowedOrigins::some_exact(&allowed_origins));
    let cors = cors.to_cors()?;

    rocket.attach(cors).launch().await?;

    Ok(())
}

#[cfg(test)]
mod test {
    use super::initialize_rocket;
    use dotenv::dotenv;
    use migration::{Migrator, MigratorTrait};
    use rocket::local::asynchronous::Client;
    use sea_orm::Database;
    use std::env;

    pub async fn init_server() -> anyhow::Result<Client> {
        dotenv().ok();
        let db_uri = env::var("TEST_DATABASE_URL").unwrap();
        let conn = Database::connect(db_uri).await?;
        Migrator::refresh(&conn).await?;

        let rocket = initialize_rocket(conn).await.unwrap();
        let client = Client::tracked(rocket)
            .await
            .expect("valid rocket instance");

        Ok(client)
    }
}
