import knex from './knex'

type Preview = {
  previewId: string
  imgBuffer: string
}
export const insertPreview = async (params: Preview) => {
  await knex.raw(
    'INSERT INTO "previews" (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING',
    [params.previewId, params.imgBuffer]
  )
}
