import { CommandModule } from 'yargs'
import { downloadCommit } from '@/modules/cross-server-sync/services/commit'
import { cliLogger } from '@/logging/logging'

const command: CommandModule<
  unknown,
  {
    commitUrl: string
    targetStreamId: string
    branchName: string
    token?: string
    commentAuthorId?: string
  }
> = {
  command: 'commit <commitUrl> <targetStreamId> [branchName] [token] [commentAuthorId]',
  describe: 'Download a commit from an external Speckle server instance',
  builder: {
    commitUrl: {
      describe:
        'Commit URL (e.g. https://speckle.xyz/streams/f0532359ac/commits/98678e2a3d or https://latest.speckle.systems/projects/92b620fb17/models/76fd8a01c8)',
      type: 'string'
    },
    targetStreamId: {
      describe: 'ID of the local stream that should receive the commit',
      type: 'string'
    },
    branchName: {
      describe: 'Stream branch that should receive the commit',
      type: 'string',
      default: 'main'
    },
    token: {
      describe: 'Target server auth token, in case the stream is private',
      type: 'string',
      default: ''
    },
    commentAuthorId: {
      describe:
        'The local user ID that should be used as the author of comments. If not specified, comments wont be pulled',
      type: 'string',
      default: ''
    }
  },
  handler: async (argv) => {
    await downloadCommit(argv, { logger: cliLogger })
  }
}

export = command
