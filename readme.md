# Speckle Server

The next iteration of the speckle server. Hopefully made to last!

## Contributing

### Local debugging & testing

To debug, simply run `npm run dev`. To test, run `npm run test`. To run tests in interactive mode, run `npm run test-watch`.

You will need to have a postgres instance running on the default settings, with two databases present, named `speckle2` and `speckle2_test`.

### Commit style
When pushing commits to this repo, please follow the following guidelines: 

1) Install [commitizen](https://www.npmjs.com/package/commitizen#commitizen-for-contributors)
2) Write code ;) 
3) When ready to commit, type in the commandline `git cz` & follow the instructions. 

## Modularity Architecture

The server dynamically loads individual 'modules' from each top level folder in `./modules`. It first loads the core modules, and thereafter others ("third party"). 

Loading consists of two stages: 
- **Preflight**: stage where a module can configure the behaviour of any shared middleware. 
- **Initialisation**: final stage, where modules should hoist their routes on the core express application.

Modules can create new and alter old database tables, if the knex migration files are present in a `migrations` subfolder (e.g., `./modules/your-module/migrations/my-new-table.js`). 

Modules should include test files. These should be located in `./modules/your-module/test`. 

TODOs: 
- Enforce a certain loading order of third party modules. 

## Authentication & Authorization

// TODO
