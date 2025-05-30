import { CommandModule } from 'yargs'
import { cliLogger as logger } from '@/observability/logging'
import {
  getWorkspaceBySlugOrIdFactory,
  getWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { db } from '@/db/knex'
import {
  getWorkspacePlanFactory,
  upsertWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { PaidWorkspacePlans, PaidWorkspacePlanStatuses } from '@speckle/shared'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { updateWorkspacePlanFactory } from '@/modules/gatekeeper/services/workspacePlans'

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
      default: PaidWorkspacePlans.Team,
      choices: [PaidWorkspacePlans.Team, PaidWorkspacePlans.Pro]
    },
    status: {
      describe: 'Status to set for the workspace plan',
      type: 'string',
      default: 'valid',
      choices: ['valid', 'paymentFailed', 'cancelationScheduled', 'canceled']
    }
  },
  handler: async (args) => {
    logger.info(
      `Setting plan for workspace '${args.workspaceSlugOrId}' to '${args.plan}' with status '${args.status}'`
    )
    const workspace = await getWorkspaceBySlugOrIdFactory({ db })(args)
    if (!workspace) {
      throw new WorkspaceNotFoundError(
        `Workspace w/ slug or id '${args.workspaceSlugOrId}' not found`
      )
    }

    const updateWorkspacePlan = updateWorkspacePlanFactory({
      getWorkspace: getWorkspaceFactory({ db }),
      upsertWorkspacePlan: upsertWorkspacePlanFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      emitEvent: getEventBus().emit
    })
    await updateWorkspacePlan({
      workspaceId: workspace.id,
      name: args.plan,
      status: args.status
    })

    logger.info(`Plan set!`)
  }
}

export = command
