# Using CLI

You can run it like so from the `server` package's root directory: `./bin/cli` (or `yarn cli`)

Use the `--help` argument to get more info about each command.

Example for running migrations: `yarn cli db migrate latest`

## Using CLI in test mode (& DB)

Use `yarn cli:test` to run the CLI in the TEST environment. This will use the test DB and will likely run some code a bit differently than in prod/dev.

# Creating new commands

CLI is defined using [yargs](https://yargs.js.org/).We use it to define hierarchical trees of commands which allows for better organization both for command definition and for using the CLI.

All commands are created in the `commands` directory. Commands should be defined using [command modules](https://github.com/yargs/yargs/blob/main/docs/advanced.md#providing-a-command-module).

Any top-level modules under `commands` will be assumed to be command modules. If you want to define a child command for a top-level command, then configure the top-level command to look for further child commands using `.commandDir()`.

Then put those child command modules in a subdirectory that is named after the top level command. So if the top level command is "db", then all of its child commands should be put inside a "db" subfolder.

Example commands dir:

```
- commands
    - db
        - migrate.js
    - db.js
```

In this case, `db.js` is the command module for the top-level `db` command. And then inside the `db` folder there's a command module `migrate.js` for the `migrate` child command of `db`.

This results in 2 commands - `db` and `db migrate`.
