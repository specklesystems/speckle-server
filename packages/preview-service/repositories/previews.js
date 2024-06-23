const knex = require('./knex')

const insertPreview = async (previewId, imgBuffer) => {
  await knex.raw(
    'INSERT INTO "previews" (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING',
    [previewId, imgBuffer]
  )
}

module.exports = {
  insertPreview
}
