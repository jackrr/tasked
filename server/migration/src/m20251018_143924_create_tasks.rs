use crate::m20220101_000001_create_table::Project;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Task::Table)
                    .if_not_exists()
                    .col(pk_uuid(Task::Id))
                    .col(string(Task::Title))
                    .col(string(Task::Status).default("todo"))
                    .col(string_null(Task::Description))
                    .col(date_time_null(Task::DueDate))
                    .col(
                        date_time(Task::CreatedAt)
                            .default(SimpleExpr::Keyword(Keyword::CurrentTimestamp)),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(TaskProject::Table)
                    .if_not_exists()
                    .primary_key(
                        Index::create()
                            .col(TaskProject::ProjectId)
                            .col(TaskProject::TaskId),
                    )
                    .col(uuid(TaskProject::ProjectId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_task")
                            .from(TaskProject::Table, TaskProject::ProjectId)
                            .to(Project::Table, Project::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .col(uuid(TaskProject::TaskId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_project")
                            .from(TaskProject::Table, TaskProject::TaskId)
                            .to(Task::Table, Task::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .col(
                        date_time(TaskProject::CreatedAt)
                            .default(SimpleExpr::Keyword(Keyword::CurrentTimestamp)),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TaskProject::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Task::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Task {
    Table,
    Id,
    Title,
    Description,
    Status,
    DueDate,
    CreatedAt,
}

#[derive(DeriveIden)]
enum TaskProject {
    Table,
    TaskId,
    ProjectId,
    CreatedAt,
}
