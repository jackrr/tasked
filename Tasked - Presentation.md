# Hello!

- Jack - product engineer at startups for last 10 or so years

---

# Disclosure

I spent more time than I think was intended on this.

I don't have a precise log, but I know I for sure spent more than 20 hours.

Reasons (I think):

- I cared to much about making it functional
- I tried to use a framework I didn't know well (svelte)
- I did use frameworks I never used before (Rocket, SeaORM)
- I'm rustier than I realized :(

---

# Process overview

- Gathered requirements
- Decided on target capabilities
- [Visual design](https://drive.google.com/file/d/1M8V1tvAaHii2yoJf4YN3g67mXN3AB9uj/view?usp=sharing) (on e-ink tablet)
- Tool choice (Rust, Svelte)
- Data models and backend workflows
- Struggle on state management vision in Svelte conventions
- Finish out with Next.js + React

---

# Essential Requirements

- Create tasks and organize into projects (many-to-many)
- Task due dates and completion
- Live data syncing

---

# Nice-to-have Target Capabilities
## (Additional ideas that I was excited to but did not get to implement)

- Offline-first
- User-aware multiplayer with visual feedback
- Multiplayer inline editing of long text fields
- Configurable filtering and sorting of tasks and projects
- Global fuzzy search
- Task ordering with dragging interaction
- Authentication and authorization
- Attribution and history (who created/edited what when)
- Comments
- Pre-requisites/dependency model for tasks and projects

---

# Design process and philosophy

*NOTE: I do not think of myself as a capable UI designer.
Doing this project without a designer or at least someone to bounce my design ideas off of felt like building an app with a hand tied behind my back.
But I tried!

Goals:
- Minimal, content focused
- Happy path should be intuitive and lack friction
- State persistence is implicit and hidden

[Rough "designs"](https://drive.google.com/file/d/1M8V1tvAaHii2yoJf4YN3g67mXN3AB9uj/view?usp=sharing) done on an e-ink tablet
  
---

# Workflow tooling

- Emacs
- LSP servers
- Local eval coding chat bot (Ollama + Qwen)
- Claude code (coding chat bot -  when devving on laptop)
- Web search (google, duckduckgo, stack overflow, developer docs, etc)
- Dad and partner harshing on my WIP implementation the other night

---

# High level architecture

- [RESTful backend API w/ websockets for push](https://github.com/jackrr/tasked/tree/main/server)
  - Rocket
  - SeaORM
  - Sqlite
- [Typescript ~~SvelteKit~~ Next.js + React frontend](https://github.com/jackrr/tasked/tree/main/app)
  - tailwind.css for all styling
  - date-fns for presentation of due dates

---

# Backend: Data model notes

- Sqlite
- SeaORM for ORM and migrations
- Task + projects models w/ join table
- uuids for ids

--- 

# Backend: API principles

- Conventional RESTful endpoint choices
- Focused endpoint responsibilities
- YAGNI - don't add unused fields or endpoints
- Contract tests: automated verification of API boundary
  - IMO most important tests for a project
  
---

# Backend: API Highlights

- `/subscribe` endpoint to set up a websocket
- All data-modifying endpoints
- PATCH endpoints for partial field updates on tasks and projects
- POST `/projects/:id/add_task?task_id=`, `/projects/:id/remove_task?task_id=` endpoints to manage associations
- 
- ... some other endpoints

## Regerts (wish I had time to fix or add...)

- Expose sorting and filtering controls on API (hardcoding frontend concerns isn't ideal)
- Lack of pagination
- Lack of test coverage for websocket subscription system
- OpenAPI spec auto-generation or other convenient API doc introspection
- CI testing (test run on Github main branch, PRs)

---

# Frontend: Svelte oopsie

Started with SvelteKit. I learned it some this summer, excited for some of the performance claims.

However, I didn't have a clear picture of how to make an organized state management system.

But I did with Next.js+React+react-query.

---

# Frontend: next.js

- react-query as store
- tailwind.css for all styling
- websocket events pushed from backend -> "targeted" cache invalidation
- dogfooding, last stages of development used the project to track work to be done

## Regerts

- Revisit combination of visual design/API design/cache invalidation workflows with the goal reduce chattiness
- Lack of e2e tests
- Lack of feedback on API errors (fails silently with data dropped)
- Task detail modal looks junky (to me)
- Mobile has some rough visual edges

---

# Tasked: Functionality overview

[Repo](https://github.com/jackrr/tasked)
[Live site (for now)](https://tasked.jackratner.com)


- Homepage: Projects list w/ task stats summaries
- Project page: Project metadata, task management (add, associate, delete)
- Task modal: description, due date, associated projects
- (Arguably too) sneaky task association
- Accommodations for simultaneous editing
- Keyboard shortcuts: delete on empty to delete, enter to add another
- Confirmation of wider impact of destruction
- All metadata you see is either directly editable or a click away
- "Hosted" for this demo using cloudflared tunnel

---

# Final reflections

- Wish I'd had more collaboration and feedback touchpoints (MVP scope, visual designs, API design)
- Built less than I'd hoped in more time than I'd hoped
- Happier than I'd anticipated with the design philosophy, despite some lingering quirks

