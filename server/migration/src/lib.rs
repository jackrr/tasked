pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20251018_143924_create_tasks;
mod m20251021_171134_task_due_date_date;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20251018_143924_create_tasks::Migration),
            Box::new(m20251021_171134_task_due_date_date::Migration),
        ]
    }
}
