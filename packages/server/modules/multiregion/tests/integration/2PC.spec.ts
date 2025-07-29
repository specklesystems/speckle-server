import { getFeatureFlags } from '@speckle/shared/environment'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { storeUserFactory } from '@/modules/core/repositories/users'
import { replicateQuery } from '@/modules/multiregion/repositories/helper'
import { Scopes, Users } from '@/modules/core/dbSchema'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { omit } from 'lodash-es'
import type { Knex } from 'knex'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = getFeatureFlags()

;(FF_WORKSPACES_MULTI_REGION_ENABLED ? describe.skip : describe)(
  '2PC @multiregion',
  async () => {
    let main: Knex
    let slave1: Knex
    let slave2: Knex
    let ALL_DBS: Knex[] = []

    before(async () => {
      main = await getDb({ regionKey: null })
      slave1 = await getDb({ regionKey: 'region1' })
      slave2 = await getDb({ regionKey: 'region2' })
      ALL_DBS = [main, slave1, slave2]
    })

    it('is able to replicate the same a user query in multiple regions', async () => {
      const email = 'test@example.com'
      const query = storeUserFactory
      const params = {
        user: {
          id: cryptoRandomString({ length: 10 }),
          name: cryptoRandomString({ length: 10 }),
          email,
          verified: true
        }
      }

      await replicateQuery({
        dbs: ALL_DBS,
        query,
        params
      })

      const userMain = await main.table(Users.name).where({ email }).first()
      const userSlave1 = await slave1.table(Users.name).where({ email }).first()
      const userSlave2 = await slave2.table(Users.name).where({ email }).first()

      const user = omit(userMain, ['createdAt', 'suuid'])

      expect(user).to.exist.and.not.be.empty
      expect(user).to.deep.equal(omit(userSlave1, ['createdAt', 'suuid']))
      expect(user).to.deep.equal(omit(userSlave2, ['createdAt', 'suuid']))
    })

    it('does not depend on the target entity, regions or data', async () => {
      const name = 'test:scope'
      const query = // example of a factory

          ({ db }: { db: Knex }) =>
          (payload: { name: string; description: string; public: boolean }) =>
            db(Scopes.name).insert(payload)

      const params = {
        name,
        description: 'something new',
        public: false
      }

      await replicateQuery({
        dbs: ALL_DBS,
        query,
        params
      })

      const scopeMain = await main.table(Scopes.name).where({ name }).first()
      const scopeSlave1 = await slave1.table(Scopes.name).where({ name }).first()
      const scopeSlave2 = await slave2.table(Scopes.name).where({ name }).first()

      expect(scopeMain).to.deep.eq({
        name,
        description: 'something new',
        public: false
      })
      expect(scopeMain).to.deep.equal(scopeSlave1)
      expect(scopeMain).to.deep.equal(scopeSlave2)
    })

    it('rolls back all commits in case of one node failure', async () => {
      const name = 'test:new:scope'
      const query =
        ({ db }: { db: Knex }) =>
        (payload: { name: string; description: string; public: boolean }) =>
          db(Scopes.name).insert(payload)

      const params = {
        name,
        description: 'something new',
        public: false
      }

      const dbThatFails = {
        transaction: () =>
          Promise.resolve(() => ({
            insert: () => Promise.resolve()
          })) // will fail on raw call
      } as unknown as Knex

      const promise = replicateQuery({
        dbs: [...ALL_DBS, dbThatFails],
        query,
        params
      })

      await expect(promise).to.eventually.be.rejected

      const scopeMain = await main.table(Scopes.name).where({ name }).first()
      const scopeSlave1 = await slave1.table(Scopes.name).where({ name }).first()
      const scopeSlave2 = await slave2.table(Scopes.name).where({ name }).first()

      expect(scopeMain).to.be.undefined
      expect(scopeSlave1).to.be.undefined
      expect(scopeSlave2).to.be.undefined
    })
  }
)
