# Knex Migrations

This is not your regular knex migrations directory.

Because the test database is expected to be in a clean state before each test, we need to run migrations rollback and up before each run of tests and additionally rollback after each run.

Therefore we can just have one single migration file, and don't need to version it.
