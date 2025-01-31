import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('object_children_closure')
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
-- Table Definition
CREATE TABLE "object_children_closure" (
    "parent" varchar(255) NOT NULL,
    "child" varchar(255) NOT NULL,
    "minDepth" int4 NOT NULL DEFAULT 1,
    "streamId" varchar(10) NOT NULL,
    CONSTRAINT "object_children_closure_streamid_foreign" FOREIGN KEY ("streamId") REFERENCES "public"."streams"("id") ON DELETE CASCADE
);
`)

  await knex.schema.alterTable('object_children_closure', (table) => {
    table.index(['streamId', 'parent'])
    table.index(['streamId', 'child'])
    table.index(['streamId', 'minDepth'])
    table.unique(['streamId', 'parent', 'child'], 'obj_parent_child_index')
    table.index(['streamId', 'parent', 'minDepth'], 'full_pcd_index')
  })
}
