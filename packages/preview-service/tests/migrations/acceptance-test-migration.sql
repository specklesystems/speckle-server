CREATE TABLE IF NOT EXISTS "object_preview" (
  "streamId" 10)
    table.string('objectId').notNullable()
    table.integer('previewStatus').notNullable().defaultTo(0)
    table.integer('priority').notNullable().defaultTo(1)
    table.timestamp('lastUpdate').notNullable().defaultTo(db.fn.now())
    table.jsonb('preview')
    table.primary(['streamId', 'objectId'])
    table.index(['previewStatus', 'priority', 'lastUpdate'])
);
