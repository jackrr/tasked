use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Project::Table)
                    .if_not_exists()
                    .col(pk_uuid(Project::Id))
                    .col(string(Project::Title))
                    .col(string_null(Project::Description))
                    .col(
                        date_time(Project::CreatedAt)
                            .default(SimpleExpr::Keyword(Keyword::CurrentTimestamp)),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Project::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Project {
    Table,
    Id,
    Title,
    Description,
    CreatedAt,
}
