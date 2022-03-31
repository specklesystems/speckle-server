// /* istanbul ignore file */
exports.up = async (knex) => {
  await knex.raw('ALTER TABLE commits ALTER COLUMN "author" DROP NOT NULL;')
  await knex.raw('ALTER TABLE commits DROP CONSTRAINT commits_author_foreign;')
  await knex.raw(`
    ALTER TABLE commits
    ADD CONSTRAINT commits_author_foreign 
    FOREIGN KEY (author) 
    REFERENCES users(id)
    ON DELETE SET NULL;
  `)

  await knex.raw('ALTER TABLE branches DROP CONSTRAINT branches_authorid_foreign;')
  await knex.raw(`
    ALTER TABLE branches
    ADD CONSTRAINT branches_authorid_foreign 
    FOREIGN KEY ("authorId") 
    REFERENCES users(id)
    ON DELETE SET NULL;
  `)
}

exports.down = async () => {
  // NOTE:
  // This migration cannot run backwards: if a user deletes their account, the previous not null
  // constraint cannot be satisfied. Therefore, there's no going back (and there isn't really a need either).
  // await knex.raw( 'ALTER TABLE branches DROP CONSTRAINT branches_authorid_foreign;' )
  // await knex.raw( `
  //   ALTER TABLE branches
  //   ADD CONSTRAINT branches_authorid_foreign
  //   FOREIGN KEY ("authorId")
  //   REFERENCES users(id);
  // ` )
  // await knex.raw( 'ALTER TABLE commits DROP CONSTRAINT commits_author_foreign;' )
  // await knex.raw( `
  //   ALTER TABLE commits
  //   ADD CONSTRAINT commits_author_foreign
  //   FOREIGN KEY (author)
  //   REFERENCES users(id);
  // ` )
  // await knex.raw( 'ALTER TABLE commits ALTER COLUMN "author" SET NOT NULL;' )
}
