import { Optional } from '@speckle/shared'
import { Objects } from '@/modules/core/dbSchema'
import { ObjectRecord } from '@/modules/core/helpers/types'

export async function getObject(objectId: string): Promise<Optional<ObjectRecord>> {
  return await Objects.knex<ObjectRecord[]>().where(Objects.col.id, objectId).first()
}
