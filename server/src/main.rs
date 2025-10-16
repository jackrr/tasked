#[macro_use]
extern crate rocket;

use dotenv::dotenv;
use entity::project::{Entity as Project, Model as ProjectModel};
use migration::{Migrator, MigratorTrait};
use rocket::State;
use rocket::serde::json::Json;
use rocket_cors::{AllowedOrigins, CorsOptions};
use sea_orm::{Database, DatabaseConnection, EntityTrait};
use std::env;

mod result;

struct Db {
    conn: DatabaseConnection,
}

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[get("/projects")]
async fn projects(db: &State<Db>) -> result::Result<Json<Vec<ProjectModel>>> {
    let projects = Project::find().all(&db.conn).await?;
    Ok(Json(projects))
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
        .manage(Db { conn })
        .mount("/", routes![index, projects])
        .launch()
        .await?;

    Ok(())
}
