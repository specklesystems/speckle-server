import { automateLogger } from '@/logging/logging'
import { GetAutomationRunFullTriggers } from '@/modules/automate/domain/operations'
import {
  AutomationsEmitter,
  AutomationsEventsListen
} from '@/modules/automate/events/automations'
import {
  AutomateRunsEmitter,
  AutomateRunsEventsListener
} from '@/modules/automate/events/runs'
import {
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import {
  ProjectAutomationsUpdatedMessageType,
  ProjectTriggeredAutomationsStatusUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import {
  ProjectSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { isNonNullable } from '@speckle/shared'

// TODO: Update AutomateRuns subscription

export const setupAutomationUpdateSubscriptionsFactory =
  (deps: {
    automationsEmitterListen: AutomationsEventsListen
    publish: PublishSubscription
  }) =>
  () => {
    const quitters = [
      deps.automationsEmitterListen(
        AutomationsEmitter.events.Created,
        async ({ automation }) => {
          await deps.publish(ProjectSubscriptions.ProjectAutomationsUpdated, {
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
      deps.automationsEmitterListen(
        AutomationsEmitter.events.Updated,
        async ({ automation }) => {
          await deps.publish(ProjectSubscriptions.ProjectAutomationsUpdated, {
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
      deps.automationsEmitterListen(
        AutomationsEmitter.events.CreatedRevision,
        async ({ automation, revision }) => {
          await deps.publish(ProjectSubscriptions.ProjectAutomationsUpdated, {
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
  getAutomationRunFullTriggers: GetAutomationRunFullTriggers
  automateRunsEventsListener: AutomateRunsEventsListener
  publish: PublishSubscription
}

export const setupStatusUpdateSubscriptionsFactory =
  (deps: SetupStatusUpdateSubscriptionsDeps) => () => {
    const { getAutomationRunFullTriggers, automateRunsEventsListener, publish } = deps

    const quitters = [
      automateRunsEventsListener(
        AutomateRunsEmitter.events.Created,
        async ({ manifests, run, automation }) => {
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
                    ...manifest,
                    run: {
                      ...run,
                      automationId: automation.id,
                      functionRuns: run.functionRuns.map((functionRun) => ({
                        ...functionRun,
                        runId: run.id
                      })),
                      triggers: run.triggers.map((trigger) => ({
                        ...trigger,
                        automationRunId: run.id
                      }))
                    },
                    type: ProjectTriggeredAutomationsStatusUpdatedMessageType.RunCreated
                  }
                }
              )
            })
          )
        }
      ),

      automateRunsEventsListener(
        AutomateRunsEmitter.events.StatusUpdated,
        async ({ run, functionRun, automationId }) => {
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
                      versionId: trigger.version.id,
                      run: {
                        ...run,
                        functionRuns: [functionRun],
                        automationId,
                        triggers: undefined
                      },
                      type: ProjectTriggeredAutomationsStatusUpdatedMessageType.RunUpdated
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
