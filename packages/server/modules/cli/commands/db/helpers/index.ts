import { getAllRegisteredDbClients } from '@/modules/multiregion/dbSelector'

export type CommonDbArgs = {
  regionKey?: string
}

export const getTargettedDbClients = async (params: { regionKey?: string }) => {
  const { regionKey } = params
  const dbs = (await getAllRegisteredDbClients()).filter((db) => {
    if (!regionKey) return true
    if (regionKey === 'main') return db.isMain
    if (regionKey.includes(',')) {
      return regionKey.split(',').includes(db.regionKey)
    }
    return db.regionKey === regionKey
  })

  return dbs
}
