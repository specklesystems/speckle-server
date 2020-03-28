# Speckle Server

The next iteration of the speckle server. Hopefully made to last!

## Contributing

### Local debugging & testing

To debug, simply run `npm run dev`. To test, run `npm run test`. To run tests in interactive mode, run `npm run test-watch`.

You will need to have a postgres instance running on the default settings, with two databases present, named `speckle2` and `speckle2_test`.

### Commit style
When pushing commits to this repo, please follow the following guidelines: 

1) Install [commitizen](https://www.npmjs.com/package/commitizen#commitizen-for-contributors) globally
3) When ready to commit, type in the commandline `git cz` & follow the prompts.

## Modules

The server dynamically loads individual 'modules' from each top level folder in `./modules`. It first loads the core modules, and thereafter others ("third party"). 

### Loading

Loading consists of two stages: 
- **Preflight**: stage where a module can configure the behaviour of any shared middleware. 
- **Initialisation**: final stage, where modules should hoist their routes on the core express application.

Modules can create new and alter old database tables, if the knex migration files are present in a `migrations` subfolder (e.g., `./modules/your-module/migrations/my-new-table.js`). 

### Structure

A module should contain in its root folder an index.js file that exposes two functions: 

```js
exports.preflight = ( ) => { }
exports.init = ( app ) => { }
```

Any database migration files should be stored and named accordingly in a `migrations` folder. Moreover, modules should include test files. These should be located in `tests`. Here's a sample structure: 

```

|-- index.js // entry file
|-- migrations
    `-- myTable.js
`-- tests
    `-- example.spec.js

```

## Authentication & Authorization

// TODO
