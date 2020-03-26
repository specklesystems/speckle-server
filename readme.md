# Speckle Server

The next iteration of the speckle server. Hopefully made to last!

## Modularity

The server dynamically loads individual 'modules' from each top level folder in `./modules`. It first loads the core modules, and thereafter others (third party). 

Loading consists of two stages: 
- **Preflight**: stage where a module can configure the behaviour of any shared middleware. 
- **Initialisation**: final stage, where modules should hoist their routes on the core express application.

Modules can create new and alter old database tables, if the knex migration files are present in a `migrations` subfolder (e.g., `./modules/your-module/migrations/my-new-table.js`). 

Modules should include test files. These should be located in `./modules/your-module/test`. 

TODOs: 
- Enforce a certain loading order. 
- Test multiple 

## Authentication & Authorization


Todos: 
- Enforce a certain loading order