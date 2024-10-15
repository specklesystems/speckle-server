import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { Users } from '@/modules/core/dbSchema'
import { UserRecord, UsersMetaRecord } from '@/modules/core/helpers/types'
import { db } from '@/db/knex'

const command: CommandModule = {
  command: 'test-meta',
  describe: 'Testing users meta behaviour',
  handler: async () => {
    cliLogger.info('Hello world!')

    const testUsers = await Users.knex<UserRecord[]>().limit(5)
    const firstUserId = testUsers[0]?.id
    const secondUserId = testUsers[1]?.id
    if (!firstUserId || !secondUserId) {
      cliLogger.error('One or more test users were not found')
      return
    }

    const meta = metaHelpers<UsersMetaRecord, typeof Users>(Users, db)

    // set value
    cliLogger.info(await meta.set(firstUserId, 'foo', false))
    cliLogger.info(await meta.set(firstUserId, 'bar', "I'm happy to see ya brodie'!\""))
    cliLogger.info(await meta.set(secondUserId, 'foo', { a: 123 }))

    // get value
    cliLogger.info(await meta.get<UsersMetaRecord<string>>(firstUserId, 'bar'))

    // get multiple values
    cliLogger.info(
      await meta.getMultiple([
        { id: firstUserId, key: 'foo' },
        { id: firstUserId, key: 'bar' },
        { id: secondUserId, key: 'foo' },
        { id: secondUserId, key: 'bar' }
      ])
    )

    // delete value
    cliLogger.info(await meta.delete(firstUserId, 'bar'))
  }
}

export = command
