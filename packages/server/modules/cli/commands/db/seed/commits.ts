import { db } from '@/db/knex'
import { cliLogger } from '@/logging/logging'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { UserNotFoundError } from '@/modules/core/errors/user'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { ForbiddenError } from '@/modules/shared/errors'
import { BasicTestCommit, createTestCommits } from '@/test/speckle-helpers/commitHelper'
import dayjs from 'dayjs'
import { times } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule<
  unknown,
  { streamId: string; count: number; authorId: string }
> = {
  command: 'commits <authorId> <streamId> <count>',
  describe: 'Generate fake commits into the specified stream',
  builder: {
    authorId: {
      describe: 'ID of the user who is going to be the commit author',
      type: 'string'
    },
    streamId: {
      describe: 'ID of the stream that should receive the commits',
      type: 'string'
    },
    count: {
      describe: 'Commit count',
      type: 'number',
      default: 50
    }
  },
  handler: async (argv) => {
    const getUser = getUserFactory({ db })
    const getStream = getStreamFactory({ db })

    const count = argv.count
    const streamId = argv.streamId
    const authorId = argv.authorId
    const date = dayjs().toISOString()

    const user = await getUser(authorId)
    if (!user?.id) {
      throw new UserNotFoundError(`User with ID ${authorId} not found`)
    }

    const stream = await getStream({ streamId, userId: user.id })
    if (!stream?.id) {
      throw new StreamNotFoundError(`Stream with ID ${streamId} not found`)
    }
    if (!stream.isPublic && !stream.role) {
      throw new ForbiddenError(
        `Commit author does not have access to the specified stream ${streamId}`
      )
    }

    cliLogger.info(`Generating ${count} objects & commits for stream ${streamId}...`)
    await createTestCommits(
      times(
        count,
        (i): BasicTestCommit => ({
          id: '',
          objectId: '',
          streamId,
          authorId,
          message: `#${i} - ${date} - Fake commit batch`
        })
      )
    )
    cliLogger.info(`...done`)
  }
}

export default command
