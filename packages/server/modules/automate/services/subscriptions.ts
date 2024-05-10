import { automateLogger } from '@/logging/logging'
import { AutomationsEmitter } from '@/modules/automate/events/automations'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import {
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import { getAutomationRunFullTriggers } from '@/modules/automate/repositories/automations'
import { ProjectAutomationsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { isNonNullable } from '@speckle/shared'

export const setupAutomationUpdateSubscriptions = () => () => {
  const quitters = [
    AutomationsEmitter.listen(
      AutomationsEmitter.events.Created,
      async ({ automation }) => {
        await publish(ProjectSubscriptions.ProjectAutomationsUpdated, {
          projectId: automation.projectId,
          projectAutomationsUpdated: {
            type: ProjectAutomationsUpdatedMessageType.Created,
            automationId: automation.id,
            automation,
            revision: null
          }
        })
      }
    ),
    AutomationsEmitter.listen(
      AutomationsEmitter.events.Updated,
      async ({ automation }) => {
        await publish(ProjectSubscriptions.ProjectAutomationsUpdated, {
          projectId: automation.projectId,
          projectAutomationsUpdated: {
            type: ProjectAutomationsUpdatedMessageType.Updated,
            automationId: automation.id,
            automation,
            revision: null
          }
        })
      }
    ),
    AutomationsEmitter.listen(
      AutomationsEmitter.events.CreatedRevision,
      async ({ automation, revision }) => {
        await publish(ProjectSubscriptions.ProjectAutomationsUpdated, {
          projectId: automation.projectId,
          projectAutomationsUpdated: {
            type: ProjectAutomationsUpdatedMessageType.CreatedRevision,
            automationId: automation.id,
            automation,
            revision
          }
        })
      }
    )
  ]

  return () => quitters.forEach((quitter) => quitter())
}

export type SetupStatusUpdateSubscriptionsDeps = {
  getAutomationRunFullTriggers: typeof getAutomationRunFullTriggers
}

export const setupStatusUpdateSubscriptions =
  (deps: SetupStatusUpdateSubscriptionsDeps) => () => {
    const { getAutomationRunFullTriggers } = deps

    const quitters = [
      AutomateRunsEmitter.listen(
        AutomateRunsEmitter.events.Created,
        async ({ manifests }) => {
          const validatedManifests = manifests
            .map((manifest) => {
              if (isVersionCreatedTriggerManifest(manifest)) {
                return manifest
              } else {
                automateLogger.error('Unexpected run trigger manifest type', {
                  manifest
                })
              }

              return null
            })
            .filter(isNonNullable)

          await Promise.all(
            validatedManifests.map(async (manifest) => {
              await publish(
                ProjectSubscriptions.ProjectTriggeredAutomationsStatusUpdated,
                {
                  projectId: manifest.projectId,
                  projectTriggeredAutomationsStatusUpdated: {
                    ...manifest
                  }
                }
              )
            })
          )
        }
      ),

      AutomateRunsEmitter.listen(
        AutomateRunsEmitter.events.StatusUpdated,
        async ({ run }) => {
          const triggers = await getAutomationRunFullTriggers({
            automationRunId: run.id
          })

          if (triggers[VersionCreationTriggerType].length) {
            const versionCreation = triggers[VersionCreationTriggerType]

            await Promise.all(
              versionCreation.map(async (trigger) => {
                await publish(
                  ProjectSubscriptions.ProjectTriggeredAutomationsStatusUpdated,
                  {
                    projectId: trigger.model.streamId,
                    projectTriggeredAutomationsStatusUpdated: {
                      projectId: trigger.model.streamId,
                      modelId: trigger.model.id,
                      versionId: trigger.version.id
                    }
                  }
                )
              })
            )
          }
        }
      )
    ]

    return () => quitters.forEach((quitter) => quitter())
  }
