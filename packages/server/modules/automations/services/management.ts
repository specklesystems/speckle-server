import { getBranchById } from '@/modules/core/repositories/branches'
import { getStream } from '@/modules/core/repositories/streams'
import { MaybeNullOrUndefined, Roles } from '@speckle/shared'
import {
  getAutomationRun,
  getAutomation,
  upsertAutomation,
  upsertAutomationFunctionRunData,
  insertAutomationFunctionRunResultVersion,
  getLatestAutomationRunsFor,
  getFunctionRunsForAutomationRuns
} from '@/modules/automations/repositories/automations'
import _, { flatMap } from 'lodash'
import {
  AutomationCreateInput,
  AutomationRunStatusUpdateInput,
  AutomationRunStatus,
  AutomationRun
} from '@/modules/core/graph/generated/graphql'
import { upsertAutomationRunData } from '@/modules/automations/repositories/automations'
import {
  AutomationFunctionRunRecord,
  AutomationFunctionRunsResultVersionRecord,
  AutomationRunRecord
} from '@/modules/automations/helpers/types'
import { ForbiddenError } from '@/modules/shared/errors'
import { Merge } from 'type-fest'
import { AutomationFunctionRunGraphQLReturn } from '@/modules/automations/helpers/graphTypes'
import { AutomationRunSchema } from '@/modules/automations/helpers/inputTypes'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { BranchNotFoundError } from '@/modules/core/errors/branch'
import { getCommits } from '@/modules/core/repositories/commits'

type AutomationRunWithFunctionRunsRecord = AutomationRunRecord & {
  functionRuns: AutomationFunctionRunRecord[]
}

export const createModelAutomation = async (
  automation: AutomationCreateInput,
  userId?: string
) => {
  // stream acl for user
  const stream = await getStream({ userId, streamId: automation.projectId })
  if (!stream) throw new StreamNotFoundError('Project not found')
  if (stream.role !== Roles.Stream.Owner)
    throw new ForbiddenError('Only project owners are allowed.')

  const branch = await getBranchById(automation.modelId, {
    streamId: automation.projectId
  })
  if (!branch) throw new BranchNotFoundError('Model not found')

  const insertModel = { ...automation, modelId: branch.id, createdAt: new Date() }
  await upsertAutomation(insertModel)
}

export async function upsertModelAutomationRunResult({
  userId,
  input
}: {
  userId: MaybeNullOrUndefined<string>
  input: AutomationRunStatusUpdateInput
}) {
  // validate input against schema
  const validatedInput = AutomationRunSchema.parse({
    ...input,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  // get the automation from the DB
  const automation = await getAutomation(input.automationId)

  // authz the current user on the automation
  const stream = await getStream({
    userId: userId || undefined,
    streamId: automation.projectId
  })
  if (!stream) throw new StreamNotFoundError('Project not found')
  if (stream.role !== Roles.Stream.Owner)
    throw new ForbiddenError('Only project owners are allowed')

  // store the result of the run, if it already exists, patch it
  const maybeAutomationRun = await getAutomationRun(input.automationRunId)
  if (maybeAutomationRun) {
    // some bits we do not allow overriding
    validatedInput.createdAt = maybeAutomationRun.createdAt
    validatedInput.versionId = maybeAutomationRun.versionId
    validatedInput.automationId = maybeAutomationRun.automationId
    validatedInput.automationRevisionId = maybeAutomationRun.automationRevisionId
  }
  await upsertAutomationRunData(validatedInput)

  // upsert run function runs
  const runs = validatedInput.functionRuns.map(
    (s): AutomationFunctionRunRecord => ({
      ...s,
      automationRunId: validatedInput.automationRunId
    })
  )
  await upsertAutomationFunctionRunData(runs)

  // validate & upsert result versions
  const versionsRecords: AutomationFunctionRunsResultVersionRecord[] = flatMap(
    validatedInput.functionRuns
      .filter((s) => s.resultVersionIds?.length)
      .map((s) => ({
        functionId: s.functionId,
        automationRunId: validatedInput.automationRunId,
        resultVersionIds: s.resultVersionIds
      })),
    (i) => {
      return i.resultVersionIds.map((v) => ({
        functionId: i.functionId,
        automationRunId: i.automationRunId,
        resultVersionId: v
      }))
    }
  )
  const validatedVersions = await getCommits(
    versionsRecords.map((r) => r.resultVersionId)
  )
  const validVersionsRecords = versionsRecords.filter((r) =>
    validatedVersions.find(
      (vv) => vv.id === r.resultVersionId && vv.streamId === stream.id
    )
  )

  await insertAutomationFunctionRunResultVersion(validVersionsRecords)

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

const anyFunctionRunsHaveStatus = (
  ar: AutomationRunWithFunctionRunsRecord,
  status: AutomationRunStatus
) => ar.functionRuns.some((st) => st.status === status)

const anyFunctionRunsHaveFailed = (ar: AutomationRunWithFunctionRunsRecord): boolean =>
  anyFunctionRunsHaveStatus(ar, AutomationRunStatus.Failed)

const anyFunctionRunsRunning = (ar: AutomationRunWithFunctionRunsRecord): boolean =>
  anyFunctionRunsHaveStatus(ar, AutomationRunStatus.Running)

const anyFunctionRunsInitializing = (
  ar: AutomationRunWithFunctionRunsRecord
): boolean => anyFunctionRunsHaveStatus(ar, AutomationRunStatus.Initializing)

export const getAutomationsStatus = async ({
  projectId,
  modelId,
  versionId
}: {
  projectId: string
  modelId: string
  versionId: string
}) => {
  const automationRunRecords = await getLatestAutomationRunsFor({
    projectId,
    modelId,
    versionId
  })
  if (!automationRunRecords.length) return null

  const functionRuns = await getFunctionRunsForAutomationRuns(
    automationRunRecords.map((r) => r.automationRunId)
  )
  const runsWithFunctionRuns: AutomationRunWithFunctionRunsRecord[] =
    automationRunRecords.map((ar) => {
      return {
        ...ar,
        functionRuns: Object.values(functionRuns[ar.automationRunId] || {})
      }
    })

  const automationRuns: Array<
    Merge<AutomationRun, { functionRuns: AutomationFunctionRunGraphQLReturn[] }>
  > = runsWithFunctionRuns.map((ar) => {
    let status: AutomationRunStatus = AutomationRunStatus.Succeeded
    if (anyFunctionRunsHaveFailed(ar)) {
      status = AutomationRunStatus.Failed
    } else if (anyFunctionRunsRunning(ar)) {
      status = AutomationRunStatus.Running
    } else if (anyFunctionRunsInitializing(ar)) {
      status = AutomationRunStatus.Initializing
    }
    return { ..._.cloneDeep(ar), status }
  })

  const failedAutomations = automationRuns.filter(
    (a) => a.status === AutomationRunStatus.Failed
  )

  const runningAutomations = automationRuns.filter(
    (a) => a.status === AutomationRunStatus.Running
  )
  const initializingAutomations = automationRuns.filter(
    (a) => a.status === AutomationRunStatus.Initializing
  )

  let status = AutomationRunStatus.Succeeded
  let statusMessage = 'All automations have succeeded'

  if (failedAutomations.length) {
    status = AutomationRunStatus.Failed
    statusMessage = 'Some automations have failed:'
    for (const fa of failedAutomations) {
      for (const functionRunStatus of fa.functionRuns) {
        if (functionRunStatus.status === AutomationRunStatus.Failed)
          statusMessage += `\n${functionRunStatus.statusMessage}`
      }
    }
  } else if (runningAutomations.length) {
    status = AutomationRunStatus.Running
    statusMessage = 'Some automations are running'
  } else if (initializingAutomations.length) {
    status = AutomationRunStatus.Initializing
    statusMessage = 'All automations are initializing'
  }
  return {
    status: status as AutomationRunStatus,
    automationRuns,
    statusMessage
  }
}
