import { logger } from '@/logging/logging'
import { Users, ServerAcl } from '@/modules/core/dbSchema'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { faker } from '@faker-js/faker'
import { range } from 'lodash'
import { UniqueEnforcer } from 'enforce-unique'
import { CommandModule } from 'yargs'
import { UserRecord } from '@/modules/core/helpers/types'

const RETRY_COUNT = 3
const UNIQUE_MAX_TIME = 500

const uniqueEnforcer = new UniqueEnforcer()

function createFakeUser() {
  return {
    id: uniqueEnforcer.enforce(() => faker.string.alphanumeric(10), {
      maxTime: UNIQUE_MAX_TIME
    }),
    name: faker.person.firstName() + ' ' + faker.person.lastName(),
    bio: faker.lorem.lines(5),
    company: faker.company.name(),
    email: uniqueEnforcer.enforce(
      () =>
        faker.internet.email({
          firstName: faker.string.alphanumeric(),
          lastName: faker.string.alphanumeric()
        }),
      {
        maxTime: UNIQUE_MAX_TIME,
        maxRetries: RETRY_COUNT
      }
    ),
    verified: faker.datatype.boolean(),
    avatar: faker.string.alphanumeric(255),
    ip: faker.internet.ipv4(),
    passwordDigest: faker.string.alphanumeric(255)
  }
}

function generateUsers(count: number) {
  const users = []
  for (let i = 0; i < count; i++) {
    users.push(createFakeUser())
  }
  return users
}

function insertUsers(users: Partial<UserRecord>[]): Promise<Array<{ id: string }>> {
  return Users.knex<UserRecord>().returning(Users.col.id).insert(users)
}

async function* batchedOperationGenerator({
  batchInsertGenerator,
  itemCount,
  batchSize,
  retryCount = 3
}: {
  batchInsertGenerator: (
    insertCount: number,
    currentItemCount: number
  ) => Promise<string[]>
  itemCount: number
  batchSize: number
  retryCount?: number
}) {
  logger.info('Starting batched operation...')
  let currentItemCount = 0
  const batchCount = Math.ceil(itemCount / batchSize)
  for (let i = 0; i < batchCount; i++) {
    logger.info(`Processing batch ${i + 1} out of ${batchCount}...`)

    const newItemCount = Math.min(currentItemCount + batchSize, itemCount)
    const insertCount = newItemCount - currentItemCount
    if (insertCount <= 0) return

    // Invoke batch generate & insert
    const execute = () =>
      Promise.resolve(batchInsertGenerator(insertCount, currentItemCount))
    let batchPromise = execute().then((res) => {
      logger.info(`...processed batch ${i + 1} out of ${batchCount}`)
      return res
    })

    // Attach retries
    range(retryCount).forEach(() => {
      batchPromise = batchPromise.catch(() => {
        return execute()
      })
    })
    batchPromise = batchPromise.catch((e) => {
      logger.error(e, 'Operation failed all retries')
      return []
    })

    currentItemCount = newItemCount
    const results = await batchPromise
    yield results
  }
}

const command: CommandModule<unknown, { count: number; batchsize: number }> = {
  command: 'users <count> [batchsize]',
  describe: 'Fill the `users` table with a ton of fake users',
  builder: {
    count: {
      describe: 'User count',
      type: 'number'
    },
    batchsize: {
      describe: 'Max amount of inserts to process at once',
      type: 'number',
      default: '500'
    }
  },
  async handler(argv) {
    const count = argv.count
    const batchSize = argv.batchsize

    const userBatchedInsertionGenerator = batchedOperationGenerator({
      batchInsertGenerator: (insertCount) => {
        const users = generateUsers(insertCount)
        return insertUsers(users).then((users) => users.map((u) => u.id))
      },
      itemCount: count,
      batchSize,
      retryCount: RETRY_COUNT
    })

    for await (const insertedIds of userBatchedInsertionGenerator) {
      logger.info('Inserting ACL entries for batch...')
      const entries = insertedIds.map((id) => ({
        role: Roles.Server.User,
        userId: id
      }))

      await ServerAcl.knex().insert(entries)
      logger.info('...inserted ACL')
    }
  }
}

export = command
