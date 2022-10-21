/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.raw(
    'ALTER TABLE "blob_storage" ALTER COLUMN "id" SET DATA TYPE varchar(255);'
  )
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.raw(
    'ALTER TABLE "blob_storage" ALTER COLUMN "id" SET DATA TYPE varchar(10);'
  )
}
