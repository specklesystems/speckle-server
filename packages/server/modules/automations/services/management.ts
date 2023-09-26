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
  getFunctionRunsForAutomationRuns,
  deleteResultVersionsForRuns
} from '@/modules/automations/repositories/automations'
import _, { flatMap, uniqBy } from 'lodash'
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
import {
  getCommits,
  getCommit,
  getCommitBranch
} from '@/modules/core/repositories/commits'
import { AutomationNotFoundError } from '@/modules/automations/errors/automations'
import { CommitNotFoundError } from '@/modules/core/errors/commit'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'

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
  if (!automation) throw new AutomationNotFoundError()

  const [stream, version, model] = await Promise.all([
    getStream({
      userId: userId || undefined,
      streamId: automation.projectId
    }),
    getCommit(validatedInput.versionId, {
      streamId: automation.projectId
    }),
    getCommitBranch(validatedInput.versionId)
  ])

  // this is never going to happen, cause the automation has an FK to the streamId
  if (!stream) throw new StreamNotFoundError('Project not found')
  if (stream.role !== Roles.Stream.Owner)
    throw new ForbiddenError('Only project owners are allowed')
  if (!version) throw new CommitNotFoundError()
  if (!model) throw new BranchNotFoundError()

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
  const runs = uniqBy(
    validatedInput.functionRuns.map(
      (s): AutomationFunctionRunRecord => ({
        ...s,
        automationRunId: validatedInput.automationRunId
      })
    ),
    (v) => `${v.automationRunId}-${v.functionId}`
  )
  await upsertAutomationFunctionRunData(runs)

  // create new result version records
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
  const validVersionsRecords = uniqBy(
    versionsRecords.filter((r) =>
      validatedVersions.find(
        (vv) => vv.id === r.resultVersionId && vv.streamId === stream.id
      )
    ),
    (v) => `${v.automationRunId}-${v.functionId}-${v.resultVersionId}`
  )

  // delete old/stale versions and re-insert new valid ones (in case this is an update to an existing run)
  await deleteResultVersionsForRuns(
    validatedInput.functionRuns.map((s) => [
      s.functionId,
      validatedInput.automationRunId
    ])
  )
  await insertAutomationFunctionRunResultVersion(validVersionsRecords)

  // Emit subscription
  const newStatus = await getAutomationsStatus({
    modelId: version.branchId,
    projectId: stream.id,
    versionId: version.id
  })
  if (newStatus) {
    await publish(ProjectSubscriptions.ProjectAutomationStatusUpdated, {
      projectId: stream.id,
      projectAutomationsStatusUpdated: {
        status: newStatus,
        version,
        project: stream,
        model
      }
    })
  }
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
    return { ..._.cloneDeep(ar), status, id: ar.automationRunId }
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
    statusMessage = 'Some automations are initializing'
  }
  return {
    status: status as AutomationRunStatus,
    automationRuns,
    statusMessage,
    id: versionId
  }
}
