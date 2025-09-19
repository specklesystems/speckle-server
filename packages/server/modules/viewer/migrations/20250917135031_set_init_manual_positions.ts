import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Set initial manual positions based on the updatedAt timestamp
  await knex.raw(`
    WITH ordered AS (
      SELECT id,
            ROW_NUMBER() OVER (ORDER BY "updatedAt") AS rn
      FROM saved_views
    )
    UPDATE saved_views
    SET position = (ordered.rn * 1000)::double precision
    FROM ordered
    WHERE saved_views.id = ordered.id;
`)
}

export async function down(knex: Knex): Promise<void> {
  // Set every position to 0
  await knex('saved_views').update({ position: 0 })
}
