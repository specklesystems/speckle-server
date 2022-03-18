## Migrations, and how to create them

First, make a new migration file in the appropriate migrations folder. To do this use `./bin/cli`.

Next, write your migration! Here's an example below that adds a new column to a table.

```js
/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('scopes', (table) => {
    table.boolean('public').defaultTo(true)
  })
}

exports.down = async (knex) => {
  let hasColumn = await knex.schema.hasColumn('scopes', 'public')
  if (hasColumn) {
    await knex.schema.alterTable('scopes', (table) => {
      table.dropColumn('public')
    })
  }
}
```

Notes:

- Do not delete or edit existing migration files
- To edit an existing table, use alter table in a new migration file.
- Always prefix your migration file with the date that you authored it in.
