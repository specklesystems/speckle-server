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

export const createModelAutomation = async (
  automation: ModelAutomationCreateInput,
  userId?: string | undefined
) => {
  // stream acl for user
  const stream = await getStream({ userId, streamId: automation.projectId })
  if (!stream) throw new Error('400 invalid projectId')
  if (stream.role !== Roles.Stream.Owner) throw new Error('401, not an owner')
  // TODO: once webhooks are migrated to FE2 terms, we need to get the branch model by id
  // const branch = await getBranchById()
  const branch = await getStreamBranchByName(automation.projectId, automation.modelId)
  if (!branch) throw new Error('400 invalid modelId')
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
  if (!stream) throw new Error('400 invalid projectId')
  if (stream.role !== Roles.Stream.Owner) throw new Error('401, not an owner')
  // 3. store the result of the run, if it already exists, patch it
  const maybeAutomationRun = await getAutomationRun(input.automationRunId)
  const insertModel = {
    ..._.cloneDeep(input),
    createdAt: new Date(),
    updatedAt: new Date()
  }
  if (maybeAutomationRun) {
    insertModel.createdAt = maybeAutomationRun.createdAt

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

export const getAutomationStatusFor = async ({
  modelId,
  versionId
}: {
  modelId: string
  versionId?: string | undefined
}) => {
  return {
    status: 'FAILED',
    statusMessage: 'cause its fake',
    automationRuns: [run]
  }
}

export const getAutomationsStatus = async ({
  modelId
}: {
  modelId: string
}): Promise<AutomationsStatus> => {
  const runs = await getLatestAutomationRunsFor({ modelId })
  return {
    status: 'FAILED' as AutomationRunStatus,
    automationRuns: [],
    statusMessage: 'o-oh'
  }
}

export const getModelAutomations = async ({
  projectId,
  modelId,
  cursor,
  limit
}: {
  projectId: string
  modelId: string
  cursor: string | null
  limit: number
}) => {
  return {
    totalCount: 1,
    cursor: null,
    items: [
      {
        automationId: 'asdf',
        // automationRevisionId: "asdf",
        createdAt: new Date()
      }
    ]
  }
}

const run = {
  versionId: 'baz',
  automationId: 'asdf',
  automationRevisionId: 'asdf',
  automationRunId: 'fake',
  runStatus: 'FAILED',
  createdAt: new Date(),
  updatedAt: new Date(),
  functionRunResults: [
    // modeling a single run ATM
    {
      functionId: 'automate all the way',
      elapsed: 20.5,
      runStatus: 'failed',
      resultsView:
        'https://latest.speckle.systems/projects/03434ee1f1/models/168bf25649',
      resultVersions: [
        'https://latest.speckle.systems/projects/03434ee1f1/models/168bf25649@0f638a4a79'
      ],
      blobs: [
        'blob:https://latest.speckle.systems/2a5fb815-6434-4577-9937-5c88420eca35'
      ],
      statusMessage: 'I want a black T-shirt.',
      objectResults: {
        afe5e2601d2072103c3eac0260a0e730: [
          {
            level: 'error',
            statusMessage: "I don't want this bump here!"
          },
          {
            level: 'warning',
            statusMessage: 'This should not be so blue.'
          }
        ]
      }
    }
  ]
}
