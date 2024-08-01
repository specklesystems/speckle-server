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
import { truncateTables } from '@/test/hooks'
import { expectToThrow } from '@/test/assertionHelper'

const scanTable = scanTableFactory<UserRecord>({ db })

describe('Helpers scanTable @core', () => {
  before(async () => {
    await truncateTables([Users.name])
  })

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

  it('should throw an error when reaching failsafe limit', async () => {
    const users = Array.from(Array(3)).map(() => ({
      id: crs({ length: 6 }),
      email: createRandomEmail(),
      passwordDigest: createRandomPassword(),
      name: createRandomPassword()
    }))

    await db(Users.name).insert(users)

    const err = await expectToThrow(async () => {
      for await (const rows of scanTable(
        { tableName: Users.name, batchSize: 1 },
        { failsafeLimitMultiplier: 1 }
      )) {
        expect(rows).to.be.ok
      }
    })
    expect(err.message).to.eq('Never ending loop')
  })
})
