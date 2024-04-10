import {
  ensureRunConditions,
  onModelVersionCreate,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'
import {
  AutomationRevisionTrigger,
  AutomationTriggerModelVersion
} from '@/modules/automate/types'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestCommit } from '@/test/speckle-helpers/commitHelper'
import {
  getAutomationRun,
  storeAutomation,
  storeAutomationRevision
} from '../repositories'
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
      const triggered: Record<string, AutomationTriggerModelVersion> = {}
      await onModelVersionCreate(
        async () => [],
        async ({ trigger, revisionId }) => {
          triggered[revisionId] = trigger
          return { automationRunId: cryptoRandomString({ length: 10 }) }
        }
      )({
        modelId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      })
      expect(Object.keys(triggered)).length(0)
    })
    it('Triggers all automation runs associated with the model', async () => {
      const storedTriggers: AutomationRevisionTrigger[] = [
        {
          triggerType: 'versionCreation',
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        },
        {
          triggerType: 'versionCreation',
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        }
      ]
      const triggered: Record<string, AutomationTriggerModelVersion> = {}
      const versionId = cryptoRandomString({ length: 10 })
      await onModelVersionCreate(
        async () => storedTriggers,
        async ({ revisionId, trigger }) => {
          triggered[revisionId] = trigger
          return { automationRunId: cryptoRandomString({ length: 10 }) }
        }
      )({
        modelId: cryptoRandomString({ length: 10 }),
        versionId
      })
      expect(Object.keys(triggered)).length(storedTriggers.length)
      storedTriggers.forEach((st) => {
        const expectedTrigger = {
          versionId,
          triggeringId: st.triggeringId,
          triggerType: st.triggerType
        }
        expect(triggered[st.automationRevisionId]).deep.equal(expectedTrigger)
      })
    })
    it('Failing automation runs do NOT break other runs.', async () => {
      const storedTriggers: AutomationRevisionTrigger[] = [
        {
          triggerType: 'versionCreation',
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        },
        {
          triggerType: 'versionCreation',
          triggeringId: cryptoRandomString({ length: 10 }),
          automationRevisionId: cryptoRandomString({ length: 10 })
        }
      ]
      const triggered: Record<string, AutomationTriggerModelVersion> = {}
      const versionId = cryptoRandomString({ length: 10 })
      await onModelVersionCreate(
        async () => storedTriggers,
        async ({ revisionId, trigger }) => {
          if (revisionId === storedTriggers[0].automationRevisionId)
            throw new Error('first one is borked')
          triggered[revisionId] = trigger
          return { automationRunId: cryptoRandomString({ length: 10 }) }
        }
      )({
        modelId: cryptoRandomString({ length: 10 }),
        versionId
      })
      expect(Object.keys(triggered)).length(storedTriggers.length - 1)
    })
  })
  describe('Triggering an automation revision run', () => {
    it('Throws if run conditions are not met', async () => {
      try {
        await triggerAutomationRevisionRun(async () => ({
          automationRunId: cryptoRandomString({ length: 10 })
        }))({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger: {
            versionId: cryptoRandomString({ length: 10 }),
            triggerType: 'versionCreation',
            triggeringId: cryptoRandomString({ length: 10 })
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
        triggerType: 'versionCreation' as const,
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
      const { automationRunId } = await triggerAutomationRevisionRun(async () => {
        throw new Error(thrownError)
      })({
        revisionId: automationRevisionId,
        trigger: {
          versionId: version.id,
          ...trigger
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
        triggerType: 'versionCreation' as const,
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
      const { automationRunId } = await triggerAutomationRevisionRun(async () => ({
        automationRunId: executionEngineRunId
      }))({
        revisionId: automationRevisionId,
        trigger: {
          versionId: version.id,
          ...trigger
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
        await ensureRunConditions(
          async () => null,
          async () => undefined,
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger: {
            triggerType: 'versionCreation',
            triggeringId: cryptoRandomString({ length: 10 }),
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
        await ensureRunConditions(
          async () => ({
            active: false,
            enabled: false,
            triggers: [],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 }),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            automationToken: cryptoRandomString({ length: 15 }),
            userId: cryptoRandomString({ length: 10 })
          }),
          async () => undefined,
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger: {
            triggerType: 'versionCreation',
            triggeringId: cryptoRandomString({ length: 10 }),
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
        await ensureRunConditions(
          async () => ({
            active: false,
            enabled: true,
            triggers: [],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 }),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            automationToken: cryptoRandomString({ length: 15 }),
            userId: cryptoRandomString({ length: 10 })
          }),
          async () => undefined,
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger: {
            triggerType: 'versionCreation',
            triggeringId: cryptoRandomString({ length: 10 }),
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
        await ensureRunConditions(
          async () => ({
            active: true,
            enabled: true,
            triggers: [],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 }),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            automationToken: cryptoRandomString({ length: 15 }),
            userId: cryptoRandomString({ length: 10 })
          }),
          async () => undefined,
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger: {
            triggerType: 'versionCreation',
            triggeringId: cryptoRandomString({ length: 10 }),
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
      const trigger = {
        triggerType: 'bogusTrigger' as const,
        triggeringId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }

      try {
        await ensureRunConditions(
          // @ts-expect-error: the bad trigger type needs to be checked
          async () => ({
            active: true,
            enabled: true,
            triggers: [trigger],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 })
          }),
          async () => null,
          async () => undefined
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          // @ts-expect-error: the bad trigger type needs to be checked
          trigger
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains('Only model version triggers are supported')
      }
    })
    it("the version that is referenced on the trigger, doesn't exist", async () => {
      const trigger = {
        triggerType: 'versionCreation' as const,
        triggeringId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }

      try {
        await ensureRunConditions(
          async () => ({
            active: true,
            enabled: true,
            triggers: [trigger],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 }),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            automationToken: cryptoRandomString({ length: 15 }),
            userId: cryptoRandomString({ length: 10 })
          }),
          async () => undefined,
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains('The triggering version is not found')
      }
    })
    it("the author, that created the triggering version doesn't exist", async () => {
      const trigger = {
        triggerType: 'versionCreation' as const,
        triggeringId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }

      try {
        await ensureRunConditions(
          async () => ({
            active: true,
            enabled: true,
            triggers: [trigger],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 }),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            automationToken: cryptoRandomString({ length: 15 }),
            userId: cryptoRandomString({ length: 10 })
          }),
          async () => ({
            author: null,
            id: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            message: 'foobar',
            parents: [],
            referencedObject: cryptoRandomString({ length: 10 }),
            totalChildrenCount: null,
            sourceApplication: 'test suite'
          }),
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger
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
      const trigger = {
        triggerType: 'versionCreation' as const,
        triggeringId: cryptoRandomString({ length: 10 }),
        versionId: cryptoRandomString({ length: 10 })
      }
      try {
        await ensureRunConditions(
          async () => ({
            active: true,
            enabled: true,
            triggers: [trigger],
            id: cryptoRandomString({ length: 10 }),
            name: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            functions: [],
            projectId: cryptoRandomString({ length: 10 }),
            automationId: cryptoRandomString({ length: 10 }),
            executionEngineAutomationId: cryptoRandomString({ length: 10 }),
            automationToken: cryptoRandomString({ length: 15 }),
            userId: cryptoRandomString({ length: 10 })
          }),
          async () => ({
            author: cryptoRandomString({ length: 10 }),
            id: cryptoRandomString({ length: 10 }),
            createdAt: new Date(),
            message: 'foobar',
            parents: [],
            referencedObject: cryptoRandomString({ length: 10 }),
            totalChildrenCount: null,
            sourceApplication: 'test suite'
          }),
          async () => null
        )({
          revisionId: cryptoRandomString({ length: 10 }),
          trigger
        })
        throw 'this should have thrown'
      } catch (error) {
        if (!(error instanceof Error)) throw error
        expect(error.message).contains('Cannot find a token for the automation')
      }
    })
  })
})
