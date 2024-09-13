import { BadRequestError } from '@/modules/shared/errors'

export const cursorFromRows = <Row, Target extends keyof Row>(
  rows: Array<Row>,
  cursorTarget: Target
) => {
  if (rows?.length > 0) {
    const lastRow = rows[rows.length - 1]
    const cursor = lastRow[cursorTarget]
    if (!(cursor instanceof Date))
      throw new BadRequestError('The cursor target is not a date object')

    return Buffer.from(cursor.toISOString()).toString('base64')
  } else {
    return null
  }
}

export const decodeCursor = (cursor: string) => {
  const decoded = Buffer.from(cursor, 'base64').toString()
  if (isNaN(Date.parse(decoded)))
    throw new BadRequestError('The cursor is not a base64 encoded date string')

  return decoded
}
