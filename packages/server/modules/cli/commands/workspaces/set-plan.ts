import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { getWorkspaceBySlugOrIdFactory } from '@/modules/workspaces/repositories/workspaces'
import { db } from '@/db/knex'
import { PaidWorkspacePlanStatuses } from '@/modules/gatekeeper/domain/billing'
import { upsertPaidWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import { PaidWorkspacePlans } from '@/modules/gatekeeper/domain/workspacePricing'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'

const command: CommandModule<
  unknown,
  {
    workspaceSlugOrId: string
    status: PaidWorkspacePlanStatuses
    plan: PaidWorkspacePlans
  }
> = {
  command: 'set-plan <workspaceSlugOrId> [plan] [status]',
  describe: 'Set a plan for a workspace.',
  builder: {
    workspaceSlugOrId: {
      describe: 'Workspace ID or slug',
      type: 'string'
    },
    plan: {
      describe: 'Plan to set the status for',
      type: 'string',
      default: 'business',
      choices: ['business', 'starter', 'plus']
    },
    status: {
      describe: 'Status to set for the workspace plan',
      type: 'string',
      default: 'valid',
      choices: [
        'valid',
        'trial',
        'expired',
        'paymentFailed',
        'cancelationScheduled',
        'canceled'
      ]
    }
  },
  handler: async (args) => {
    cliLogger.info(
      `Setting plan for workspace '${args.workspaceSlugOrId}' to '${args.plan}' with status '${args.status}'`
    )
    const workspace = await getWorkspaceBySlugOrIdFactory({ db })(args)
    if (!workspace) {
      throw new WorkspaceNotFoundError(
        `Workspace w/ slug or id '${args.workspaceSlugOrId}' not found`
      )
    }

    await upsertPaidWorkspacePlanFactory({ db })({
      workspacePlan: {
        createdAt: new Date(),
        workspaceId: workspace.id,
        name: args.plan,
        status: args.status
      }
    })
    cliLogger.info(`Plan set!`)
  }
}

export = command
