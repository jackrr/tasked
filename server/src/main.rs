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
use api::tasks;

mod models;
mod result;

#[cfg(test)]
mod test_helpers;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

async fn initialize_rocket(db_conn: DatabaseConnection) -> anyhow::Result<Rocket<Build>> {
    let rocket = rocket::build()
        .manage(db_conn)
        .mount("/", routes![index])
        .mount("/", projects::routes())
        .mount("/", tasks::routes());

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
