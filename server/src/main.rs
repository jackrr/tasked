#[macro_use]
extern crate rocket;

use dotenv::dotenv;
use migration::{Migrator, MigratorTrait};
use rocket_cors::{AllowedOrigins, CorsOptions};
use sea_orm::Database;
use std::env;

mod api;
use api::projects;

mod result;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[rocket::main]
async fn main() -> anyhow::Result<()> {
    // Initialize dotenv in nonprod
    #[cfg(debug_assertions)]
    dotenv().ok();

    let db_url = env::var("DATABASE_URL").unwrap();

    let conn = Database::connect(db_url).await?;
    Migrator::up(&conn, None).await?;

    let allowed_origins = env::var("ALLOWED_ORIGINS").unwrap();
    let allowed_origins: Vec<&str> = allowed_origins.split(",").collect();
    let cors = CorsOptions::default().allowed_origins(AllowedOrigins::some_exact(&allowed_origins));
    let cors = cors.to_cors()?;

    let _rocket = rocket::build()
        .attach(cors)
        .manage(conn)
        .mount("/projects", projects::routes())
        .mount("/", routes![index])
        .launch()
        .await?;

    Ok(())
}
