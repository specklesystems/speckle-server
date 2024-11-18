import { CommandModule } from 'yargs'
import { cliLogger } from '@/logging/logging'
import { getWorkspaceBySlugOrIdFactory } from '@/modules/workspaces/repositories/workspaces'
import { db } from '@/db/knex'
import {
  PaidWorkspacePlanStatuses,
  PlanStatuses
} from '@/modules/gatekeeper/domain/billing'
import { upsertPaidWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import { PaidWorkspacePlans } from '@/modules/gatekeeper/domain/workspacePricing'

const command: CommandModule<
  unknown,
  {
    workspaceSlugOrId: string
    status: PlanStatuses
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
      choices: ['business', 'team', 'pro']
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
      throw new Error(`Workspace w/ slug or id '${args.workspaceSlugOrId}' not found`)
    }

    await upsertPaidWorkspacePlanFactory({ db })({
      workspacePlan: {
        workspaceId: workspace.id,
        name: args.plan,
        status: args.status as PaidWorkspacePlanStatuses
      }
    })
    cliLogger.info(`Plan set!`)
  }
}

export = command
