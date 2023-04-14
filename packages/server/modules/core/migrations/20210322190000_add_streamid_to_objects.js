// /* istanbul ignore file */

/* Migration steps:
  // Remove foreign key constraint in commits
  // Add objects.streamId column, remove existing primary key constraint, add unique composite index for (streamId, id)
  // Fix closure table (add streamId column that refers to both parent and child, recreate all indexes to include it)
  // Create new objects and new closures (starting from commits)
  // Delete objects and closures that don't have streamId
  // Set streamId as notNullable in closures
  // delete composite index (streamId, id) and Create composite primary key on the same fields (unique index was used as a workaround bc we can't have composite PK with null values)
*/
exports.up = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.dropForeign('referencedObject')
  })

  await knex.schema.alterTable('objects', (table) => {
    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.dropPrimary()
    table.unique(['streamId', 'id'])
    table.index('id')
    table.index('streamId')
  })

  await knex.schema.alterTable('object_children_closure', (table) => {
    /* Created with:
      table.string( 'parent' ).notNullable( ).index( )
      table.string( 'child' ).notNullable( ).index( )
      table.integer( 'minDepth' ).defaultTo( 1 ).notNullable( ).index( )
      table.unique( [ 'parent', 'child' ], 'obj_parent_child_index' )
      table.index( [ 'parent', 'minDepth' ], 'full_pcd_index' )
    */
    table.dropIndex('parent')
    table.dropIndex('child')
    table.dropIndex('minDepth')
    table.dropUnique(['parent', 'child'], 'obj_parent_child_index')
    table.dropIndex(['parent', 'minDepth'], 'full_pcd_index')

    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.index(['streamId', 'parent'])
    table.index(['streamId', 'child'])
    table.index(['streamId', 'minDepth'])
    table.unique(['streamId', 'parent', 'child'], 'obj_parent_child_index')
    table.index(['streamId', 'parent', 'minDepth'], 'full_pcd_index')
  })

  await knex.raw(`
    INSERT INTO objects
    (
      "streamId",
      "id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", "data"
    )
    SELECT
      stream_commits."streamId",
      O."id", O."speckleType", O."totalChildrenCount", O."totalChildrenCountByDepth", O."createdAt", O."data"
    FROM
      commits
      INNER JOIN stream_commits on "id" = "commitId"
      INNER JOIN objects O on "referencedObject" = O."id"
    ON CONFLICT DO NOTHING
   `)

  await knex.raw(`
    INSERT INTO objects
    (
      "streamId",
      "id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", "data"
    )
    SELECT
      stream_commits."streamId",
      O."id", O."speckleType", O."totalChildrenCount", O."totalChildrenCountByDepth", O."createdAt", O."data"
    FROM
      commits
      INNER JOIN stream_commits ON "id" = "commitId"
      INNER JOIN object_children_closure ON commits."referencedObject" = object_children_closure."parent"
      INNER JOIN objects O on object_children_closure."child" = O."id"
    ON CONFLICT DO NOTHING
  `)

  await knex.raw(`
    INSERT INTO object_children_closure
    (
      "streamId", "parent", "child", "minDepth"
    )
    SELECT
      O."streamId",
      C."parent", C."child", C."minDepth"
    FROM
      object_children_closure C
      INNER JOIN objects O ON "parent" = "id"
    WHERE O."streamId" IS NOT NULL
  `)
  await knex.raw(`
    DELETE FROM object_children_closure WHERE "streamId" IS NULL
  `)
  await knex.raw(`
    DELETE FROM objects WHERE "streamId" IS NULL
  `)

  await knex.raw(`
    ALTER TABLE object_children_closure ALTER COLUMN "streamId" SET NOT NULL;
  `)

  await knex.schema.alterTable('objects', (table) => {
    table.dropUnique(['streamId', 'id'])
    table.primary(['streamId', 'id'])
  })
}

/*
  Revert data and schema
*/
exports.down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('objects', 'streamId')
  if (hasColumn) {
    await knex.schema.alterTable('objects', (table) => {
      table.dropPrimary()
      table.dropForeign('streamId')
    })

    await knex.raw(`
      ALTER TABLE objects ALTER COLUMN "streamId" DROP NOT NULL;
    `)
    await knex.raw(`
      ALTER TABLE object_children_closure ALTER COLUMN "streamId" DROP NOT NULL;
    `)

    await knex.raw(`
      CREATE UNIQUE INDEX "tmp_uniqueid_for_null_stm_idx" ON objects ("id") WHERE "streamId" IS NULL
    `)

    await knex.raw(`
      INSERT INTO objects
      (
        "id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", "data"
      )
      SELECT "id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", "data"
      FROM
        objects
      ON CONFLICT DO NOTHING
    `)

    await knex.raw(`
      CREATE UNIQUE INDEX "tmp_unique_pc_for_no_stream_idx" ON object_children_closure ("parent", "child") WHERE "streamId" IS NULL;
    `)

    await knex.raw(`
      INSERT INTO object_children_closure ("parent", "child", "minDepth")
      SELECT "parent", "child", "minDepth" FROM object_children_closure
      ON CONFLICT DO NOTHING
    `)

    await knex.raw(`
      DROP INDEX "tmp_uniqueid_for_null_stm_idx";
    `)
    await knex.raw(`
      DROP INDEX "tmp_unique_pc_for_no_stream_idx";
    `)

    await knex.raw(`
      DELETE FROM object_children_closure WHERE "streamId" IS NOT NULL
    `)
    await knex.raw(`
      DELETE FROM objects WHERE "streamId" IS NOT NULL
    `)
    await knex.raw(`
      DELETE FROM commits WHERE "referencedObject" NOT IN (SELECT id FROM objects WHERE "referencedObject" = commits."referencedObject")
    `)

    await knex.schema.alterTable('object_children_closure', (table) => {
      table.dropIndex(['streamId', 'parent'])
      table.dropIndex(['streamId', 'child'])
      table.dropIndex(['streamId', 'minDepth'])
      table.dropUnique(['streamId', 'parent', 'child'], 'obj_parent_child_index')
      table.dropIndex(['streamId', 'parent', 'minDepth'], 'full_pcd_index')
      table.dropColumn('streamId')

      table.index('parent')
      table.index('child')
      table.index('minDepth')
      table.unique(['parent', 'child'], 'obj_parent_child_index')
      table.index(['parent', 'minDepth'], 'full_pcd_index')
    })

    await knex.schema.alterTable('objects', (table) => {
      table.dropIndex('id')
      table.dropColumn('streamId')
      table.primary('id')
    })

    await knex.schema.alterTable('commits', (table) => {
      table.foreign('referencedObject').references('id').inTable('objects')
    })
  }
}
