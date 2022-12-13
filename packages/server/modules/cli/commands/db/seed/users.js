const { logger } = require('@/logging/logging')
const { Users, ServerAcl } = require('@/modules/core/dbSchema')
const { Roles } = require('@/modules/core/helpers/mainConstants')
const { faker } = require('@faker-js/faker')
const { range } = require('lodash')

const RETRY_COUNT = 3
const UNIQUE_MAX_TIME = 500

function createFakeUser() {
  return {
    id: faker.unique(faker.random.alphaNumeric, [10], { maxTime: UNIQUE_MAX_TIME }),
    name: faker.name.firstName() + ' ' + faker.name.lastName(),
    bio: faker.lorem.lines(5),
    company: faker.company.companyName(),
    email: faker.unique(
      faker.internet.email,
      [
        faker.unique(faker.random.alphaNumeric, [10]),
        faker.unique(faker.random.alphaNumeric, [10])
      ],
      { maxTime: UNIQUE_MAX_TIME }
    ),
    verified: faker.datatype.boolean(),
    avatar: faker.random.alphaNumeric(255),
    ip: faker.internet.ipv4(),
    passwordDigest: faker.random.alphaNumeric(255)
  }
}

function generateUsers(count) {
  const users = []
  for (let i = 0; i < count; i++) {
    users.push(createFakeUser())
  }
  return users
}

function insertUsers(users) {
  return Users.knex().returning(Users.col.id).insert(users)
}

async function* batchedOperationGenerator({
  batchInsertGenerator,
  itemCount,
  batchSize,
  retryCount = 3
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
    })

    currentItemCount = newItemCount
    const results = await batchPromise
    yield results
  }
}

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'users <count> [batchsize]',
  describe: 'Fill the `users` table with a ton of fake users',
  builder(yargs) {
    return yargs
      .positional('count', {
        describe: 'User count',
        type: 'number'
      })
      .positional('batchsize', {
        describe: 'Max amount of inserts to process at once',
        type: 'number',
        default: '500'
      })
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

module.exports = command
