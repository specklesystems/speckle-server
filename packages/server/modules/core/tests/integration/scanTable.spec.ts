import { describe } from 'mocha'
import { scanTableFactory } from '@/modules/core/helpers/scanTable'
import { db } from '@/db/knex'
import { UserRecord } from '@/modules/core/helpers/types'
import { Users } from '@/modules/core/dbSchema'
import { expect } from 'chai'
import crs from 'crypto-random-string'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'

const scanTable = scanTableFactory<UserRecord>({ db })

describe('Helpers scanTable @core', () => {
  it('should scan table', async () => {
    const users = Array.from(Array(10)).map(() => ({
      id: crs({ length: 6 }),
      email: createRandomEmail(),
      passwordDigest: createRandomPassword(),
      name: createRandomPassword()
    }))

    await db(Users.name).insert(users)

    let offset = 0
    for await (const rows of scanTable({
      tableName: Users.name,
      batchSize: 3
    })) {
      for (let i = 0; i < rows.length; i++) {
        expect(rows[i].id).to.eq(users[i + offset].id)
      }
      offset += 3
    }
  })
})
