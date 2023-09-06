import { ModelAutomation } from '@/modules/automations/helpers/types'
import { getStreamBranchesByName } from '@/modules/core/repositories/branches'
import { getStream } from '@/modules/core/repositories/streams'
import { publish } from '@/modules/shared/utils/subscriptions'
import {
  AutomationsStatus,
  ModelAutomationRunResultCreateInput
} from '@/test/graphql/generated/graphql'
import { Roles } from '@speckle/shared'

export const createModelAutomation = async (
  userId: string,
  automation: ModelAutomation
) => {
  // stream acl for user
  const stream = await getStream({ userId, streamId: automation.projectId })
  if (!stream) throw new Error('400 invalid projectId')
  if (stream.role !== Roles.Stream.Owner) throw new Error('401, not an owner')
  // TODO: once webhooks are migrated to FE2 terms, we need to get the branch model by id
  // const branch = await getBranchById()
  const branch = await getStreamBranchesByName(automation.projectId, automation.modelId)
}

export async function storeModelAutomationRunResult({
  userId,
  input
}: {
  userId: string | null | undefined
  input: ModelAutomationRunResultCreateInput
}): Promise<boolean> {
  return false
  // 1. get the automation from the DB
  // 2. authz the current user on the automation
  // 3. store the result of the run, if it already exists, patch it
  // 4. publish an event for new automation run creation
  // 5. publish an event for new run result update
  // the last two events should be separated.
  // automate should publish the new run linked to the model / version, with function run results as pending
  // the running function should only update the function run result
  // this is, so that FE subscriptions can be added properly.
  // when a new run is triggered, the frontend should react to that
  // also for the result of independent function run results.
  // we're now shortcutting this until the one automation one function barrier is there.
  publish(automationRunStatusUpdate, { foo: 'bar' })
}

type AutomationStatus = 'INITIALIZING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'

export const getAutomationStatusFor = ({
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

const getLatestAutomationRunsFor = ({ modelId }: { modelId: string }) => { }

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
