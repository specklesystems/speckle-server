import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { downloadProject } from '@/modules/cross-server-sync/services/project'

const command: CommandModule<
  unknown,
  {
    projectUrl: string
    authorId: string
    syncComments: boolean
    token: string
  }
> = {
  command: 'project <projectUrl> <authorId> [syncComments] [token]',
  describe: 'Download a project from an external Speckle server instance',
  builder: {
    projectUrl: {
      describe:
        'Public Project URL (e.g. https://latest.speckle.systems/projects/594d657cdd)',
      type: 'string'
    },
    authorId: {
      describe: 'ID of the local user that will own the project',
      type: 'string'
    },
    syncComments: {
      describe: 'Whether or not to sync comments as well',
      type: 'boolean',
      default: true
    },
    token: {
      describe: 'The authorisation token for private streams',
      type: 'string'
    }
  },
  handler: async (argv) => {
    await downloadProject(argv, {
      logger: cliLogger,
      token: argv.token?.length ? argv.token : undefined
    })
  }
}

export = command
