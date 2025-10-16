# Tasked

Tasked - a simple project management web app.

## First time setup

1. Clone this repo
1. Install [bun](https://bun.sh/)
1. Install [rust](https://rustup.rs/)
1. Create an empty `tmp` directory in the root of the cloned repo:
```bash
mkdir tmp
```
1. Create a `.env` file, replacing "/path/to/your/clone/" with the absolute path to the cloned repo:
```bash
echo "DATABASE_URL=sqlite:///path/to/your/clone/tmp/db.sqlite?mode=rwc" > server/.env
```

## Dev

1. Start the Rust server with by running `cargo run` from the `server` directory
1. Start the Svelte dev server by running `bun dev` from the `app` directory

## Adding entities

All the following should be run from within the `server` directory.

1. Install `sea-orm-cli` if you haven't already: `cargo install sea-orm-cli@^2.0.0-rc`
FIXME: this isn't complete
1. Generate a migration template file:
```bash
sea-orm-cli migrate generate
```
2. Edit the generated file according to the desired schema
3. Generate the corresponding entity file:
```bash
sea-orm-cli generate entity --with-serde both --output-dir entity/src/entities
```
