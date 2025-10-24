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
5. Create a server `.env` file, replacing "/path/to/your/clone/" with the absolute path to the cloned repo:
  ```bash
  echo "DATABASE_URL=sqlite:///path/to/your/clone/tmp/db.sqlite?mode=rwc" > server/.env
  echo "ALLOWED_ORIGINS=http://localhost:3000" >> server/.env
  ```
5. And create a client `.env` file, replacing "/path/to/your/clone/" with the absolute path to the cloned repo:
  ```bash
  echo "NEXT_PUBLIC_WS_URI=ws://localhost:8000" > app/.env
  echo "NEXT_PUBLIC_API_URI=https://localhost:8000" >> app/.env
  ```
6. Run `bun install` from the `app` directory

## Dev

1. Start the Rust server with by running `cargo run` from the `server` directory
1. Start the Next.js dev server by running `bun dev` from the `app` directory

## Adding entities

All the following should be run from within the `server` directory.

1. Install `sea-orm-cli` if you haven't already: `cargo install sea-orm-cli@^2.0.0-rc`
1. Generate a migration template file:
```bash
sea-orm-cli migrate generate <your_change>
```
2. Edit the generated file according to the desired schema
3. Generate the corresponding entity file:
```bash
sea-orm-cli generate entity --with-serde both --output-dir entity/src/entities
```
