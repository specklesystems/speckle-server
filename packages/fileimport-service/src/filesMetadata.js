const knex = require('../knex')

module.exports = {
  async getFileInfoByName({ streamId, fileName }) {
    const { rows } = await knex.raw(
      `
      SELECT 
        id as "fileId", "streamId", "branchName", "userId", "fileName", "fileType"
      FROM file_uploads
      WHERE "streamId" = ? AND "fileName" = ?
      ORDER BY "uploadDate" DESC
      LIMIT 1
    `,
      [streamId, fileName]
    )
    return rows[0]
  }
}
