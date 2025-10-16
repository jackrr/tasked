# Tasked

Tasked - a simple project management web app.

## First time setup

1. Clone this repo

### Server setup
1. Install [rust](https://rustup.rs/)
2. Install `sea-orm-cli`: `cargo install sea-orm-cli@^2.0.0-rc`
3. Create an empty `tmp` directory in the root of the cloned repo:
```bash
mkdir tmp
```
4. Create a `.env` file containing a sqlite database path:
```bash
echo "DATABASE_URL=sqlite:///path/to/your/clone/tmp/db.sqlite?mode=rwc" > server/.env
```
5. Run the following to bootstrap your sqlite database with the schema:
```bash
cd server
sea-orm-cli migrate up
```

### Client app setup

TODO: finish me!
1. Install bun
1. 


## Adding entities

All the following should be run from within the `server` directory.

1. Generate a migration template file:
FIXME
```bash
sea-orm-cli migrate generate
```
2. Edit the generated file according to the desired schema
3. Generate the corresponding entity file:
```bash
sea-orm-cli generate entity --with-serde both --output-dir entity/src/entities
```
