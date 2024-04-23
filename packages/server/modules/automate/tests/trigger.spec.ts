import {
  ensureRunConditions,
  onModelVersionCreate,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'
import {
  AutomationTriggerDefinitionRecord,
  AutomationTriggerType,
  BaseTriggerManifest,
  VersionCreatedTriggerManifest,
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestCommit } from '@/test/speckle-helpers/commitHelper'
import {
  getAutomationRun,
  storeAutomation,
  storeAutomationRevision
} from '@/modules/automate/repositories/index'
import { beforeEachContext } from '@/test/hooks'

describe('Automate triggers @automate', () => {
  const testUser = {
    id: cryptoRandomString({ length: 10 }),
    name: 'The Automaton',
    email: 'the@automaton.com'
  }
  before(async () => {
    await beforeEachContext()
    await createTestUser(testUser)
  })
  describe('On model version create', () => {
    it('No trigger no run', async () => {
      const triggered: Record<string, BaseTriggerManifest> = {}
      await onModelVersionCreate({
        getTriggers: async () => [],
        triggerFunction: async ({ manifest, revisionId }) => {
          triggered[revisionId] = manifest
          return { automationRunId: cryptoRandomString({ length: 10 }) }
        }
      })({
        modelId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      })
      expect(Object.keys(triggered)).length(0)
    })
    it('Triggers all automation runs associated with the model', async () => {
      const storedTriggers: AutomationTriggerDefinitionRecord[] = [
        {
          triggerType: VersionCreationTriggerType,
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        },
        {
          triggerType: VersionCreationTriggerType,
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        }
      ]
      const triggered: Record<string, VersionCreatedTriggerManifest> = {}
      const versionId = cryptoRandomString({ length: 10 })
      await onModelVersionCreate({
        getTriggers: async <
          T extends AutomationTriggerType = AutomationTriggerType
        >() => storedTriggers as AutomationTriggerDefinitionRecord<T>[],
        triggerFunction: async ({ revisionId, manifest }) => {
          if (!isVersionCreatedTriggerManifest(manifest)) {
            throw new Error('unexpected trigger type')
          }

          triggered[revisionId] = manifest
          return { automationRunId: cryptoRandomString({ length: 10 }) }
        }
      })({
        modelId: cryptoRandomString({ length: 10 }),
        versionId
      })
      expect(Object.keys(triggered)).length(storedTriggers.length)
      storedTriggers.forEach((st) => {
        const expectedTrigger: VersionCreatedTriggerManifest = {
          versionId,
          modelId: st.triggeringId,
          triggerType: st.triggerType
        }
        expect(triggered[st.automationRevisionId]).deep.equal(expectedTrigger)
      })
    })
    it('Failing automation runs do NOT break other runs.', async () => {
      const storedTriggers: AutomationTriggerDefinitionRecord[] = [
        {
          triggerType: VersionCreationTriggerType,
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        },
        {
          triggerType: VersionCreationTriggerType,
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        }
      ]
      const triggered: Record<string, VersionCreatedTriggerManifest> = {}
      const versionId = cryptoRandomString({ length: 10 })
      await onModelVersionCreate({
        getTriggers: async <
          T extends AutomationTriggerType = AutomationTriggerType
        >() => storedTriggers as AutomationTriggerDefinitionRecord<T>[],
        triggerFunction: async ({ revisionId, manifest }) => {
          if (!isVersionCreatedTriggerManifest(manifest)) {
            throw new Error('unexpected trigger type')
          }
          if (revisionId === storedTriggers[0].automationRevisionId)
            throw new Error('first one is borked')

          triggered[revisionId] = manifest
          return { automationRunId: cryptoRandomString({ length: 10 }) }
        }
      })({
        modelId: cryptoRandomString({ length: 10 }),
        versionId
      })
      expect(Object.keys(triggered)).length(storedTriggers.length - 1)
    })
  })
  describe('Triggering an automation revision run', () => {
    it('Throws if run conditions are not met', async () => {
      try {
        await triggerAutomationRevisionRun({
          automateRunTrigger: async () => ({
            automationRunId: cryptoRandomString({ length: 10 })
          })
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest: <VersionCreatedTriggerManifest>{
            versionId: cryptoRandomString({ length: 10 }),
            triggerType: VersionCreationTriggerType,
            modelId: cryptoRandomString({ length: 10 })
          }
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains(
          "Cannot trigger the given revision, it doesn't exist"
        )
      }
    })
    it('Saves run with an error if automate run trigger fails', async () => {
      const userId = testUser.id

      const project = {
        name: cryptoRandomString({ length: 10 }),
        id: cryptoRandomString({ length: 10 }),
        ownerId: userId,
        isPublic: true
      }

      await createTestStream(project, testUser)
      const version = {
        id: cryptoRandomString({ length: 10 }),
        streamId: project.id,
        objectId: null,
        authorId: userId
      }
      // @ts-expect-error force setting the objectId to null
      await createTestCommit(version)
      // create automation,
      const automation = {
        id: cryptoRandomString({ length: 10 }),
        createdAt: new Date(),
        name: cryptoRandomString({ length: 15 }),
        enabled: true,
        projectId: project.id,
        executionEngineAutomationId: cryptoRandomString({ length: 10 }),
        userId
      }
      const automationToken = {
        automationId: automation.id,
        automateToken: cryptoRandomString({ length: 10 }),
        automateRefreshToken: cryptoRandomString({ length: 10 })
      }
      await storeAutomation(automation, automationToken)

      const automationRevisionId = cryptoRandomString({ length: 10 })
      const trigger = {
        triggerType: VersionCreationTriggerType,
        triggeringId: cryptoRandomString({ length: 10 })
      }
      // create revision,
      await storeAutomationRevision({
        id: automationRevisionId,
        createdAt: new Date(),
        automationId: automation.id,
        active: true,
        triggers: [trigger],
        userId,
        functions: [
          {
            functionId: cryptoRandomString({ length: 10 }),
            functionInputs: null,
            functionReleaseId: cryptoRandomString({ length: 10 })
          }
        ]
      })
      const thrownError = 'trigger failed'
      const { automationRunId } = await triggerAutomationRevisionRun({
        automateRunTrigger: async () => {
          throw new Error(thrownError)
        }
      })({
        revisionId: automationRevisionId,
        manifest: <VersionCreatedTriggerManifest>{
          versionId: version.id,
          modelId: trigger.triggeringId,
          triggerType: trigger.triggerType
        }
      })

      const storedRun = await getAutomationRun(automationRunId)
      if (!storedRun) throw 'cant fint the stored run'

      const expectedStatus = 'error'

      expect(storedRun.status).to.equal(expectedStatus)
      for (const run of storedRun.functionRuns) {
        expect(run.status).to.equal(expectedStatus)
        expect(run.statusMessage).to.equal(thrownError)
      }
    })
    it('Saves run with the execution engine run id if trigger is successful', async () => {
      // create user, project, model, version

      const userId = testUser.id

      const project = {
        name: cryptoRandomString({ length: 10 }),
        id: cryptoRandomString({ length: 10 }),
        ownerId: userId,
        isPublic: true
      }

      await createTestStream(project, testUser)
      const version = {
        id: cryptoRandomString({ length: 10 }),
        streamId: project.id,
        objectId: null,
        authorId: userId
      }
      // @ts-expect-error force setting the objectId to null
      await createTestCommit(version)
      // create automation,
      const automation = {
        id: cryptoRandomString({ length: 10 }),
        createdAt: new Date(),
        name: cryptoRandomString({ length: 15 }),
        enabled: true,
        projectId: project.id,
        executionEngineAutomationId: cryptoRandomString({ length: 10 }),
        userId
      }
      const automationToken = {
        automationId: automation.id,
        automateToken: cryptoRandomString({ length: 10 }),
        automateRefreshToken: cryptoRandomString({ length: 10 })
      }
      await storeAutomation(automation, automationToken)

      const automationRevisionId = cryptoRandomString({ length: 10 })
      const trigger = {
        triggerType: VersionCreationTriggerType,
        triggeringId: cryptoRandomString({ length: 10 })
      }
      // create revision,
      await storeAutomationRevision({
        id: automationRevisionId,
        createdAt: new Date(),
        automationId: automation.id,
        active: true,
        triggers: [trigger],
        userId,
        functions: [
          {
            functionId: cryptoRandomString({ length: 10 }),
            functionInputs: null,
            functionReleaseId: cryptoRandomString({ length: 10 })
          }
        ]
      })
      const executionEngineRunId = cryptoRandomString({ length: 10 })
      const { automationRunId } = await triggerAutomationRevisionRun({
        automateRunTrigger: async () => ({
          automationRunId: executionEngineRunId
        })
      })({
        revisionId: automationRevisionId,
        manifest: <VersionCreatedTriggerManifest>{
          versionId: version.id,
          modelId: trigger.triggeringId,
          triggerType: trigger.triggerType
        }
      })

      const storedRun = await getAutomationRun(automationRunId)
      if (!storedRun) throw 'cant fint the stored run'

      const expectedStatus = 'pending'

      expect(storedRun.status).to.equal(expectedStatus)
      expect(storedRun.executionEngineRunId).to.equal(executionEngineRunId)
      for (const run of storedRun.functionRuns) {
        expect(run.status).to.equal(expectedStatus)
      }
    })
  })
  describe('Run conditions are NOT met if', () => {
    it("the referenced revision doesn't exist", async () => {
      try {
        await ensureRunConditions({
          revisionGetter: async () => null,
          versionGetter: async () => undefined,
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest: <VersionCreatedTriggerManifest>{
            triggerType: VersionCreationTriggerType,
            modelId: cryptoRandomString({ length: 10 }),
            versionId: cryptoRandomString({ length: 10 })
          }
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains(
          "Cannot trigger the given revision, it doesn't exist"
        )
      }
    })
    it('the automation is not enabled', async () => {
      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            enabled: false,
            createdAt: new Date(),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            userId: cryptoRandomString({ length: 10 }),
            revision: {
              id: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              userId: cryptoRandomString({ length: 10 }),
              active: false,
              triggers: [],
              functions: [],
              automationId: cryptoRandomString({ length: 10 }),
              automationToken: cryptoRandomString({ length: 15 })
            }
          }),
          versionGetter: async () => undefined,
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest: <VersionCreatedTriggerManifest>{
            triggerType: VersionCreationTriggerType,
            modelId: cryptoRandomString({ length: 10 }),
            versionId: cryptoRandomString({ length: 10 })
          }
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains(
          'The automation is not enabled, cannot trigger it'
        )
      }
    })
    it('the revision is not active', async () => {
      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            enabled: true,
            createdAt: new Date(),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            userId: cryptoRandomString({ length: 10 }),
            revision: {
              active: false,
              triggers: [],
              functions: [],
              automationId: cryptoRandomString({ length: 10 }),
              automationToken: cryptoRandomString({ length: 15 }),
              id: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              userId: cryptoRandomString({ length: 10 })
            }
          }),
          versionGetter: async () => undefined,
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest: <VersionCreatedTriggerManifest>{
            triggerType: VersionCreationTriggerType,
            modelId: cryptoRandomString({ length: 10 }),
            versionId: cryptoRandomString({ length: 10 })
          }
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains(
          'The automation revision is not active, cannot trigger it'
        )
      }
    })
    it("the revision doesn't have the referenced trigger", async () => {
      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            userId: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            enabled: true,
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            revision: {
              id: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              userId: cryptoRandomString({ length: 10 }),
              active: true,
              triggers: [],
              functions: [],
              automationId: cryptoRandomString({ length: 10 }),
              automationToken: cryptoRandomString({ length: 15 })
            }
          }),
          versionGetter: async () => undefined,
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest: <VersionCreatedTriggerManifest>{
            triggerType: VersionCreationTriggerType,
            modelId: cryptoRandomString({ length: 10 }),
            versionId: cryptoRandomString({ length: 10 })
          }
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains(
          "The given revision doesn't have a trigger registered matching the input trigger"
        )
      }
    })
    it('the trigger is not a versionCreation type', async () => {
      const manifest: VersionCreatedTriggerManifest = {
        // @ts-expect-error: intentionally using invalid type here
        triggerType: 'bogusTrigger' as const,
        modelId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }

      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            enabled: true,
            createdAt: new Date(),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            userId: cryptoRandomString({ length: 10 }),
            revision: {
              id: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              userId: cryptoRandomString({ length: 10 }),
              active: true,
              triggers: [
                {
                  triggeringId: manifest.modelId,
                  triggerType: manifest.triggerType,
                  automationRevisionId: cryptoRandomString({ length: 10 })
                }
              ],
              functions: [],
              automationId: cryptoRandomString({ length: 10 })
            }
          }),
          versionGetter: async () => undefined,
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains('Only model version triggers are supported')
      }
    })
    it("the version that is referenced on the trigger, doesn't exist", async () => {
      const manifest: VersionCreatedTriggerManifest = {
        triggerType: VersionCreationTriggerType,
        modelId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }

      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            enabled: true,
            createdAt: new Date(),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            userId: cryptoRandomString({ length: 10 }),
            revision: {
              id: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              userId: cryptoRandomString({ length: 10 }),
              active: true,
              triggers: [
                {
                  triggerType: manifest.triggerType,
                  triggeringId: manifest.modelId,
                  automationRevisionId: cryptoRandomString({ length: 10 })
                }
              ],
              functions: [],
              automationId: cryptoRandomString({ length: 10 }),
              automationToken: cryptoRandomString({ length: 15 })
            }
          }),
          versionGetter: async () => undefined,
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains('The triggering version is not found')
      }
    })
    it("the author, that created the triggering version doesn't exist", async () => {
      const manifest: VersionCreatedTriggerManifest = {
        triggerType: VersionCreationTriggerType,
        modelId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }

      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            enabled: true,
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            userId: cryptoRandomString({ length: 10 }),
            revision: {
              id: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              active: true,
              triggers: [
                {
                  triggeringId: manifest.modelId,
                  triggerType: manifest.triggerType,
                  automationRevisionId: cryptoRandomString({ length: 10 })
                }
              ],
              createdAt: new Date(),
              functions: [],
              automationId: cryptoRandomString({ length: 10 }),
              automationToken: cryptoRandomString({ length: 15 })
            }
          }),
          versionGetter: async () => ({
            author: null,
            id: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            message: 'foobar',
            parents: [],
            referencedObject: cryptoRandomString({ length: 10 }),
            totalChildrenCount: null,
            sourceApplication: 'test suite',
            streamId: cryptoRandomString({ length: 10 }),
            branchId: cryptoRandomString({ length: 10 }),
            branchName: cryptoRandomString({ length: 10 })
          }),
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains(
          "The user, that created the triggering version doesn't exist any more"
        )
      }
    })
    it("the automation doesn't have a token available", async () => {
      const manifest: VersionCreatedTriggerManifest = {
        triggerType: VersionCreationTriggerType,
        modelId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }
      try {
        await ensureRunConditions({
          revisionGetter: async () => ({
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            enabled: true,
            createdAt: new Date(),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            userId: cryptoRandomString({ length: 10 }),
            revision: {
              id: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              active: true,
              triggers: [
                {
                  triggeringId: manifest.modelId,
                  triggerType: manifest.triggerType,
                  automationRevisionId: cryptoRandomString({ length: 10 })
                }
              ],
              functions: [],
              automationId: cryptoRandomString({ length: 10 }),
              automationToken: cryptoRandomString({ length: 15 })
            }
          }),
          versionGetter: async () => ({
            author: cryptoRandomString({ length: 10 }),
            id: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            message: 'foobar',
            parents: [],
            referencedObject: cryptoRandomString({ length: 10 }),
            totalChildrenCount: null,
            sourceApplication: 'test suite',
            streamId: cryptoRandomString({ length: 10 }),
            branchId: cryptoRandomString({ length: 10 }),
            branchName: cryptoRandomString({ length: 10 })
          }),
          automationTokenGetter: async () => null
        })({
          revisionId: cryptoRandomString({ length: 10 }),
          manifest
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains('Cannot find a token for the automation')
      }
    })
  })
})
