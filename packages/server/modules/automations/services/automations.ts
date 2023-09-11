import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getStream } from '@/modules/core/repositories/streams'
import { Roles } from '@speckle/shared'
import {
  getAutomationRun,
  getLatestAutomationRunsFor,
  getModelAutomation,
  storeModelAutomation
} from '@/modules/automations/repositories/automations'
import _ from 'lodash'
import {
  ModelAutomationCreateInput,
  ModelAutomationRunStatusUpdateInput,
  AutomationRunStatus,
  AutomationsStatus
} from '@/modules/core/graph/generated/graphql'
import { upsertAutomationRunData } from '@/modules/automations/repositories/automations'
import { AutomationRun, AutomationRunSchema } from '../helpers/types'
import { ForbiddenError, BadRequestError } from '@/modules/shared/errors'

export const createModelAutomation = async (
  automation: ModelAutomationCreateInput,
  userId?: string | undefined
) => {
  // stream acl for user
  const stream = await getStream({ userId, streamId: automation.projectId })
  if (!stream) throw new BadRequestError('400 invalid projectId')
  if (stream.role !== Roles.Stream.Owner)
    throw new ForbiddenError('Only project owners are allowed.')
  // TODO: once webhooks are migrated to FE2 terms, we need to get the branch model by id
  // const branch = await getBranchById()
  const branch = await getStreamBranchByName(automation.projectId, automation.modelId)
  if (!branch) throw new BadRequestError('400 invalid modelId')
  const insertModel = { ...automation, createdAt: new Date() }
  await storeModelAutomation(insertModel)
}

export async function upsertModelAutomationRunResult({
  userId,
  input
}: {
  userId: string | null | undefined
  input: ModelAutomationRunStatusUpdateInput
}) {
  // 1. get the automation from the DB
  const automation = await getModelAutomation(input.automationId)
  // 2. authz the current user on the automation
  const stream = await getStream({
    userId: userId || undefined,
    streamId: automation.projectId
  })
  if (!stream) throw new BadRequestError('400 invalid projectId')
  if (stream.role !== Roles.Stream.Owner)
    throw new ForbiddenError('Only project owners are allowed')
  // 3. store the result of the run, if it already exists, patch it
  const maybeAutomationRun = await getAutomationRun(input.automationRunId)
  const insertModel = AutomationRunSchema.parse({
    ...input,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  if (maybeAutomationRun) {
    // some bits we do not allow overriding
    insertModel.createdAt = maybeAutomationRun.createdAt
    insertModel.versionId = maybeAutomationRun.versionId
    insertModel.automationId = maybeAutomationRun.automationId
    insertModel.automationRevisionId = maybeAutomationRun.automationRevisionId

    // if the function run status is not in the update, add it from the DB to not loose its data
    maybeAutomationRun.functionRunStatuses.map((functionRunStatus) => {
      if (
        !insertModel.functionRunStatuses.some(
          (frs) => frs.functionId === functionRunStatus.functionId
        )
      )
        insertModel.functionRunStatuses.push(functionRunStatus)
    })
  }
  await upsertAutomationRunData(insertModel)
  // 4. publish an event for new automation run creation
  // 5. publish an event for new run result update
  // the last two events should be separated.
  // automate should publish the new run linked to the model / version, with function run results as pending
  // the running function should only update the function run result
  // this is, so that FE subscriptions can be added properly.
  // when a new run is triggered, the frontend should react to that
  // also for the result of independent function run results.
  // we're now shortcutting this until the one automation one function barrier is there.
  // publish(automationRunStatusUpdate, { foo: 'bar' })
}

const anyFunctionRunsHaveStatus = (ar: AutomationRun, status: AutomationRunStatus) =>
  ar.functionRunStatuses.some((st) => st.runStatus === status)

const anyFunctionRunsHaveFailed = (ar: AutomationRun): boolean =>
  anyFunctionRunsHaveStatus(ar, AutomationRunStatus.Failed)

const anyFunctionRunsRunning = (ar: AutomationRun): boolean =>
  anyFunctionRunsHaveStatus(ar, AutomationRunStatus.Running)

const anyFunctionRunsInitializing = (ar: AutomationRun): boolean =>
  anyFunctionRunsHaveStatus(ar, AutomationRunStatus.Initializing)

export const getAutomationsStatus = async ({
  projectId,
  modelId,
  versionId
}: {
  projectId: string
  modelId: string
  versionId: string
}): Promise<AutomationsStatus | null> => {
  const automationRuns = await getLatestAutomationRunsFor({
    projectId,
    modelId,
    versionId
  })
  // automation is registered, but no run status have been reported
  if (!automationRuns.length) return null

  const modelAutomationRuns = automationRuns.map((ar) => {
    let status: AutomationRunStatus = AutomationRunStatus.Succeeded
    if (anyFunctionRunsHaveFailed(ar)) {
      status = AutomationRunStatus.Failed
    } else if (anyFunctionRunsRunning(ar)) {
      status = AutomationRunStatus.Running
    } else if (anyFunctionRunsInitializing(ar)) {
      status = AutomationRunStatus.Initializing
    }
    return { ..._.cloneDeep(ar), runStatus: status }
  })

  const failedAutomations = modelAutomationRuns.filter(
    (a) => a.runStatus === AutomationRunStatus.Failed
  )

  const runningAutomations = modelAutomationRuns.filter(
    (a) => a.runStatus === AutomationRunStatus.Running
  )
  const initializingAutomations = modelAutomationRuns.filter(
    (a) => a.runStatus === AutomationRunStatus.Initializing
  )

  let status = AutomationRunStatus.Succeeded
  let statusMessage = 'All automations have succeeded'

  if (failedAutomations.length) {
    status = AutomationRunStatus.Failed
    statusMessage = 'Some automations have failed:'
    for (const fa of failedAutomations) {
      for (const functionRunStatus of fa.functionRunStatuses) {
        if (functionRunStatus.runStatus === AutomationRunStatus.Failed)
          statusMessage += `\n${functionRunStatus.statusMessage}`
      }
    }
  } else if (runningAutomations.length) {
    status = AutomationRunStatus.Running
  } else if (initializingAutomations.length) {
    status = AutomationRunStatus.Initializing
  }
  return {
    status: status as AutomationRunStatus,
    automationRuns: modelAutomationRuns,
    statusMessage
  }
}
