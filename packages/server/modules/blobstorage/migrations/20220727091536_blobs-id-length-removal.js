/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const up = async (knex) => {
  await knex.raw(
    'ALTER TABLE "blob_storage" ALTER COLUMN "id" SET DATA TYPE varchar(255);'
  )
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const down = async (knex) => {
  await knex.raw(
    'ALTER TABLE "blob_storage" ALTER COLUMN "id" SET DATA TYPE varchar(10);'
  )
}

export { up, down }
