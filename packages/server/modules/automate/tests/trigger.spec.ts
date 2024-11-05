import {
  FunctionRunReportStatusError,
  FunctionRunNotFoundError
} from '@/modules/automate/errors/runs'
import {
  ManuallyTriggerAutomationDeps,
  ensureRunConditionsFactory,
  manuallyTriggerAutomationFactory,
  onModelVersionCreateFactory,
  triggerAutomationRevisionRunFactory
} from '@/modules/automate/services/trigger'
import {
  AutomationRecord,
  AutomationRevisionRecord,
  AutomationRunStatuses,
  AutomationTriggerDefinitionRecord,
  AutomationTriggerType,
  BaseTriggerManifest,
  LiveAutomation,
  RunTriggerSource,
  VersionCreatedTriggerManifest,
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  BasicTestStream,
  createTestStream,
  createTestStreams
} from '@/test/speckle-helpers/streamHelper'
import { createTestCommit } from '@/test/speckle-helpers/commitHelper'
import {
  InsertableAutomationRun,
  storeAutomationFactory,
  storeAutomationTokenFactory,
  storeAutomationRevisionFactory,
  getAutomationFactory,
  updateAutomationFactory,
  getFunctionRunFactory,
  upsertAutomationFunctionRunFactory,
  getFullAutomationRunByIdFactory,
  upsertAutomationRunFactory,
  getAutomationTokenFactory,
  getAutomationTriggerDefinitionsFactory,
  getFullAutomationRevisionMetadataFactory,
  updateAutomationRevisionFactory,
  updateAutomationRunFactory
} from '@/modules/automate/repositories/automations'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { Automate } from '@speckle/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  getBranchLatestCommitsFactory,
  getLatestStreamBranchFactory
} from '@/modules/core/repositories/branches'
import {
  buildAutomationCreate,
  buildAutomationRevisionCreate,
  generateFunctionId,
  generateFunctionReleaseId
} from '@/test/speckle-helpers/automationHelper'
import { expectToThrow } from '@/test/assertionHelper'
import { Commits } from '@/modules/core/dbSchema'
import { BranchRecord } from '@/modules/core/helpers/types'
import { reportFunctionRunStatusFactory } from '@/modules/automate/services/runsManagement'
import { AutomateRunStatus } from '@/modules/core/graph/generated/graphql'
import {
  getEncryptionKeyPairFor,
  getEncryptionPublicKey,
  getFunctionInputDecryptorFactory
} from '@/modules/automate/services/encryption'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import { mapGqlStatusToDbStatus } from '@/modules/automate/utils/automateFunctionRunStatus'
import { db } from '@/db/knex'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import { getCommitFactory } from '@/modules/core/repositories/commits'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const storeAutomation = storeAutomationFactory({ db })
const storeAutomationToken = storeAutomationTokenFactory({ db })
const storeAutomationRevision = storeAutomationRevisionFactory({ db })
const getAutomation = getAutomationFactory({ db })
const updateAutomation = updateAutomationFactory({ db })
const getFunctionRun = getFunctionRunFactory({ db })
const upsertAutomationFunctionRun = upsertAutomationFunctionRunFactory({ db })
const getFullAutomationRunById = getFullAutomationRunByIdFactory({ db })
const upsertAutomationRun = upsertAutomationRunFactory({ db })
const getAutomationToken = getAutomationTokenFactory({ db })
const getAutomationTriggerDefinitions = getAutomationTriggerDefinitionsFactory({ db })
const getFullAutomationRevisionMetadata = getFullAutomationRevisionMetadataFactory({
  db
})
const updateAutomationRevision = updateAutomationRevisionFactory({ db })
const updateAutomationRun = updateAutomationRunFactory({ db })
const getBranchLatestCommits = getBranchLatestCommitsFactory({ db })
const getCommit = getCommitFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const createAppToken = createAppTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
})

;(FF_AUTOMATE_MODULE_ENABLED ? describe : describe.skip)(
  'Automate triggers @automate',
  () => {
    const testUser: BasicTestUser = {
      id: cryptoRandomString({ length: 10 }),
      name: 'The Automaton',
      email: 'the@automaton.com'
    }

    const otherUser: BasicTestUser = {
      id: cryptoRandomString({ length: 10 }),
      name: 'The Automaton Other',
      email: 'theother@automaton.com'
    }

    const testUserStream: BasicTestStream = {
      id: '',
      name: 'First stream',
      isPublic: true,
      ownerId: ''
    }

    const otherUserStream: BasicTestStream = {
      id: '',
      name: 'Other stream',
      isPublic: true,
      ownerId: ''
    }

    let testUserStreamModel: BranchRecord
    let createdAutomation: Awaited<ReturnType<ReturnType<typeof buildAutomationCreate>>>
    let createdRevision: Awaited<
      ReturnType<ReturnType<typeof buildAutomationRevisionCreate>>
    >
    let publicKey: string

    before(async () => {
      await beforeEachContext()
      await createTestUsers([testUser, otherUser])
      publicKey = await getEncryptionPublicKey()

      const createAutomation = buildAutomationCreate()
      const createRevision = buildAutomationRevisionCreate()

      await createTestStreams([
        [testUserStream, testUser],
        [otherUserStream, otherUser]
      ])

      const [projectModel, newAutomation] = await Promise.all([
        getLatestStreamBranchFactory({ db })(testUserStream.id),
        createAutomation({
          userId: testUser.id,
          projectId: testUserStream.id,
          input: {
            name: 'Manually Triggerable Automation',
            enabled: true
          }
        })
      ])

      testUserStreamModel = projectModel
      createdAutomation = newAutomation

      createdRevision = await createRevision({
        userId: testUser.id,
        input: {
          automationId: createdAutomation.automation.id,
          triggerDefinitions: <Automate.AutomateTypes.TriggerDefinitionsSchema>{
            version: 1.0,
            definitions: [{ type: 'VERSION_CREATED', modelId: testUserStreamModel.id }]
          },
          functions: [
            {
              functionReleaseId: generateFunctionReleaseId(),
              functionId: generateFunctionId(),
              parameters: null
            }
          ]
        },
        projectId: testUserStream.id
      })

      expect(createdRevision).to.be.ok
    })
    describe('On model version create', () => {
      it('No trigger no run', async () => {
        const triggered: Record<string, BaseTriggerManifest> = {}
        await onModelVersionCreateFactory({
          getAutomation: async () => ({} as AutomationRecord),
          getAutomationRevision: async () => ({} as AutomationRevisionRecord),
          getTriggers: async () => [],
          triggerFunction: async ({ manifest, revisionId }) => {
            triggered[revisionId] = manifest
            return { automationRunId: cryptoRandomString({ length: 10 }) }
          }
        })({
          modelId: cryptoRandomString({ length: 10 }),
          versionId: cryptoRandomString({ length: 10 }),
          projectId: cryptoRandomString({ length: 10 })
        })
        expect(Object.keys(triggered)).length(0)
      })
      it('Does not trigger test automations', async () => {
        const triggered: Record<string, BaseTriggerManifest> = {}
        await onModelVersionCreateFactory({
          getAutomation: async () => ({ isTestAutomation: true } as AutomationRecord),
          getAutomationRevision: async () => ({} as AutomationRevisionRecord),
          getTriggers: async () => [],
          triggerFunction: async ({ manifest, revisionId }) => {
            triggered[revisionId] = manifest
            return { automationRunId: cryptoRandomString({ length: 10 }) }
          }
        })({
          modelId: cryptoRandomString({ length: 10 }),
          versionId: cryptoRandomString({ length: 10 }),
          projectId: cryptoRandomString({ length: 10 })
        })
        expect(Object.keys(triggered)).length(0)
      })
      it('Triggers all automation runs associated with the model', async () => {
        const storedTriggers: AutomationTriggerDefinitionRecord<
          typeof VersionCreationTriggerType
        >[] = [
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
        const projectId = cryptoRandomString({ length: 10 })

        await onModelVersionCreateFactory({
          getAutomation: async () => ({} as AutomationRecord),
          getAutomationRevision: async () => ({} as AutomationRevisionRecord),
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
          versionId,
          projectId
        })
        expect(Object.keys(triggered)).length(storedTriggers.length)
        storedTriggers.forEach((st) => {
          const expectedTrigger: VersionCreatedTriggerManifest = {
            versionId,
            modelId: st.triggeringId,
            triggerType: st.triggerType,
            projectId
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
        await onModelVersionCreateFactory({
          getAutomation: async () => ({} as AutomationRecord),
          getAutomationRevision: async () => ({} as AutomationRevisionRecord),
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
          versionId,
          projectId: cryptoRandomString({ length: 10 })
        })
        expect(Object.keys(triggered)).length(storedTriggers.length - 1)
      })
    })
    describe('Triggering an automation revision run', () => {
      it('Throws if run conditions are not met', async () => {
        try {
          await triggerAutomationRevisionRunFactory({
            automateRunTrigger: async () => ({
              automationRunId: cryptoRandomString({ length: 10 })
            }),
            getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
              buildDecryptor
            }),
            getEncryptionKeyPairFor,
            createAppToken,
            automateRunsEmitter: AutomateRunsEmitter.emit,
            getAutomationToken,
            upsertAutomationRun,
            getFullAutomationRevisionMetadata,
            getBranchLatestCommits,
            getCommit
          })({
            revisionId: cryptoRandomString({ length: 10 }),
            manifest: <VersionCreatedTriggerManifest>{
              versionId: cryptoRandomString({ length: 10 }),
              triggerType: VersionCreationTriggerType,
              modelId: cryptoRandomString({ length: 10 })
            },
            source: RunTriggerSource.Manual
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
        const automation: LiveAutomation<AutomationRecord> = {
          id: cryptoRandomString({ length: 10 }),
          createdAt: new Date(),
          updatedAt: new Date(),
          name: cryptoRandomString({ length: 15 }),
          enabled: true,
          projectId: project.id,
          executionEngineAutomationId: cryptoRandomString({ length: 10 }),
          isTestAutomation: false,
          userId
        }
        const automationToken = {
          automationId: automation.id,
          automateToken: cryptoRandomString({ length: 10 }),
          automateRefreshToken: cryptoRandomString({ length: 10 })
        }
        await storeAutomation(automation)
        await storeAutomationToken(automationToken)

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
          publicKey,
          functions: [
            {
              functionInputs: null,
              functionReleaseId: cryptoRandomString({ length: 10 }),
              functionId: cryptoRandomString({ length: 10 })
            }
          ]
        })
        const thrownError = 'trigger failed'
        const { automationRunId } = await triggerAutomationRevisionRunFactory({
          automateRunTrigger: async () => {
            throw new Error(thrownError)
          },
          getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
            buildDecryptor
          }),
          getEncryptionKeyPairFor,
          createAppToken,
          automateRunsEmitter: AutomateRunsEmitter.emit,
          getAutomationToken,
          upsertAutomationRun,
          getFullAutomationRevisionMetadata,
          getBranchLatestCommits,
          getCommit
        })({
          revisionId: automationRevisionId,
          manifest: <VersionCreatedTriggerManifest>{
            versionId: version.id,
            modelId: trigger.triggeringId,
            triggerType: trigger.triggerType
          },
          source: RunTriggerSource.Manual
        })

        const storedRun = await getFullAutomationRunById(automationRunId)
        if (!storedRun) throw 'cant fint the stored run'

        const expectedStatus = 'exception'

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
        const automation: LiveAutomation<AutomationRecord> = {
          id: cryptoRandomString({ length: 10 }),
          createdAt: new Date(),
          updatedAt: new Date(),
          name: cryptoRandomString({ length: 15 }),
          enabled: true,
          projectId: project.id,
          executionEngineAutomationId: cryptoRandomString({ length: 10 }),
          isTestAutomation: false,
          userId
        }
        const automationToken = {
          automationId: automation.id,
          automateToken: cryptoRandomString({ length: 10 }),
          automateRefreshToken: cryptoRandomString({ length: 10 })
        }
        await storeAutomation(automation)
        await storeAutomationToken(automationToken)

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
          publicKey,
          functions: [
            {
              functionInputs: null,
              functionReleaseId: cryptoRandomString({ length: 10 }),
              functionId: cryptoRandomString({ length: 10 })
            }
          ]
        })
        const executionEngineRunId = cryptoRandomString({ length: 10 })
        const { automationRunId } = await triggerAutomationRevisionRunFactory({
          automateRunTrigger: async () => ({
            automationRunId: executionEngineRunId
          }),
          getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
            buildDecryptor
          }),
          getEncryptionKeyPairFor,
          createAppToken,
          automateRunsEmitter: AutomateRunsEmitter.emit,
          getAutomationToken,
          upsertAutomationRun,
          getFullAutomationRevisionMetadata,
          getBranchLatestCommits,
          getCommit
        })({
          revisionId: automationRevisionId,
          manifest: <VersionCreatedTriggerManifest>{
            versionId: version.id,
            modelId: trigger.triggeringId,
            triggerType: trigger.triggerType
          },
          source: RunTriggerSource.Manual
        })

        const storedRun = await getFullAutomationRunById(automationRunId)
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
          await ensureRunConditionsFactory({
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
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                id: cryptoRandomString({ length: 10 }),
                createdAt: new Date(),
                publicKey,
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
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                publicKey,
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
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: true,
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                publicKey,
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
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                publicKey,
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
          versionId: cryptoRandomString({ length: 10 }),
          projectId: cryptoRandomString({ length: 10 })
        }

        try {
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                id: cryptoRandomString({ length: 10 }),
                createdAt: new Date(),
                userId: cryptoRandomString({ length: 10 }),
                active: true,
                publicKey,
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
          versionId: cryptoRandomString({ length: 10 }),
          projectId: cryptoRandomString({ length: 10 })
        }

        try {
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              createdAt: new Date(),
              updatedAt: new Date(),
              enabled: true,
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                id: cryptoRandomString({ length: 10 }),
                userId: cryptoRandomString({ length: 10 }),
                active: true,
                publicKey,
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
          versionId: cryptoRandomString({ length: 10 }),
          projectId: cryptoRandomString({ length: 10 })
        }
        try {
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              executionEngineAutomationId: cryptoRandomString({ length: 10 }),
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: false,
              revision: {
                id: cryptoRandomString({ length: 10 }),
                userId: cryptoRandomString({ length: 10 }),
                createdAt: new Date(),
                active: true,
                publicKey,
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
      it('the automation is a test automation', async () => {
        const manifest: VersionCreatedTriggerManifest = {
          triggerType: VersionCreationTriggerType,
          modelId: cryptoRandomString({ length: 10 }),
          versionId: cryptoRandomString({ length: 10 }),
          projectId: cryptoRandomString({ length: 10 })
        }
        try {
          await ensureRunConditionsFactory({
            revisionGetter: async () => ({
              id: cryptoRandomString({ length: 10 }),
              name: cryptoRandomString({ length: 10 }),
              projectId: cryptoRandomString({ length: 10 }),
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              executionEngineAutomationId: null,
              userId: cryptoRandomString({ length: 10 }),
              isTestAutomation: true,
              revision: {
                id: cryptoRandomString({ length: 10 }),
                userId: cryptoRandomString({ length: 10 }),
                createdAt: new Date(),
                active: true,
                publicKey,
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
          expect(error.message).contains('This is a test automation')
        }
      })
    })

    describe('Run triggered manually', () => {
      const buildManuallyTriggerAutomation = (
        overrides?: Partial<ManuallyTriggerAutomationDeps>
      ) => {
        const trigger = manuallyTriggerAutomationFactory({
          getAutomationTriggerDefinitions,
          getAutomation,
          getBranchLatestCommits,
          triggerFunction: triggerAutomationRevisionRunFactory({
            automateRunTrigger: async () => ({
              automationRunId: cryptoRandomString({ length: 10 })
            }),
            getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
              buildDecryptor
            }),
            getEncryptionKeyPairFor,
            createAppToken,
            automateRunsEmitter: AutomateRunsEmitter.emit,
            getAutomationToken,
            upsertAutomationRun,
            getFullAutomationRevisionMetadata,
            getBranchLatestCommits,
            getCommit
          }),
          validateStreamAccess,
          ...(overrides || {})
        })
        return trigger
      }

      it('fails if referring to nonexistent automation', async () => {
        const trigger = buildManuallyTriggerAutomation()

        const e = await expectToThrow(
          async () =>
            await trigger({
              automationId: cryptoRandomString({ length: 10 }),
              userId: testUser.id,
              projectId: testUserStream.id
            })
        )
        expect(e.message).to.eq('Automation not found')
      })

      it('fails if project id is mismatched from automation id', async () => {
        const trigger = buildManuallyTriggerAutomation()

        const e = await expectToThrow(
          async () =>
            await trigger({
              automationId: createdAutomation.automation.id,
              userId: testUser.id,
              projectId: otherUserStream.id
            })
        )
        expect(e.message).to.eq('Automation not found')
      })

      it('fails if revision has no version creation triggers', async () => {
        const trigger = buildManuallyTriggerAutomation({
          getAutomationTriggerDefinitions: async () => []
        })

        const e = await expectToThrow(
          async () =>
            await trigger({
              automationId: createdAutomation.automation.id,
              userId: testUser.id,
              projectId: testUserStream.id
            })
        )
        expect(e.message).to.eq(
          'No model version creation triggers found for the automation'
        )
      })

      it('fails if user does not have access to automation', async () => {
        const trigger = buildManuallyTriggerAutomation()

        const e = await expectToThrow(
          async () =>
            await trigger({
              automationId: createdAutomation.automation.id,
              userId: otherUser.id,
              projectId: testUserStream.id
            })
        )
        expect(e.message).to.eq('User does not have required access to stream')
      })

      it('fails if no versions found for any triggers', async () => {
        const trigger = buildManuallyTriggerAutomation()

        const e = await expectToThrow(
          async () =>
            await trigger({
              automationId: createdAutomation.automation.id,
              userId: testUser.id,
              projectId: testUserStream.id
            })
        )
        expect(e.message).to.eq(
          'No version to trigger on found for the available triggers'
        )
      })

      describe('with valid versions available', () => {
        beforeEach(async () => {
          await createTestCommit({
            id: '',
            objectId: '',
            streamId: testUserStream.id,
            authorId: testUser.id
          })
        })

        afterEach(async () => {
          await truncateTables([Commits.name])
          await Promise.all([
            updateAutomation({
              id: createdAutomation.automation.id,
              enabled: true
            }),
            updateAutomationRevision({
              id: createdRevision.id,
              active: true
            })
          ])
        })

        it('fails if automation is disabled', async () => {
          await updateAutomation({
            id: createdAutomation.automation.id,
            enabled: false
          })

          const trigger = buildManuallyTriggerAutomation()

          const e = await expectToThrow(
            async () =>
              await trigger({
                automationId: createdAutomation.automation.id,
                userId: testUser.id,
                projectId: testUserStream.id
              })
          )
          expect(e.message).to.eq('The automation is not enabled, cannot trigger it')
        })

        it('fails if automation revision is disabled', async () => {
          await updateAutomationRevision({
            id: createdRevision.id,
            active: false
          })

          const trigger = buildManuallyTriggerAutomation()

          const e = await expectToThrow(
            async () =>
              await trigger({
                automationId: createdAutomation.automation.id,
                userId: testUser.id,
                projectId: testUserStream.id
              })
          )
          expect(e.message).to.eq(
            'No model version creation triggers found for the automation'
          )
        })

        it('succeeds', async () => {
          const trigger = buildManuallyTriggerAutomation()

          const { automationRunId } = await trigger({
            automationId: createdAutomation.automation.id,
            userId: testUser.id,
            projectId: testUserStream.id
          })

          const storedRun = await getFullAutomationRunById(automationRunId)
          expect(storedRun).to.be.ok

          const expectedStatus = 'pending'
          expect(storedRun!.status).to.equal(expectedStatus)
          for (const run of storedRun!.functionRuns) {
            expect(run.status).to.equal(expectedStatus)
          }
        })
      })
    })

    describe('Existing automation run', () => {
      let automationRun: InsertableAutomationRun

      before(async () => {
        const testVersion = {
          id: cryptoRandomString({ length: 10 }),
          authorId: testUser.id,
          streamId: testUserStream.id,
          branchName: testUserStreamModel.name,
          objectId: ''
        }

        await createTestCommit(testVersion)
        // Insert automation run directly to DB
        automationRun = {
          id: cryptoRandomString({ length: 10 }),
          automationRevisionId: createdRevision.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: AutomationRunStatuses.running,
          executionEngineRunId: cryptoRandomString({ length: 10 }),
          triggers: [
            {
              triggeringId: testVersion.id,
              triggerType: VersionCreationTriggerType
            }
          ],
          functionRuns: [
            {
              functionId: generateFunctionId(),
              functionReleaseId: generateFunctionReleaseId(),
              id: cryptoRandomString({ length: 15 }),
              status: AutomationRunStatuses.running,
              elapsed: 0,
              results: null,
              contextView: null,
              statusMessage: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }

        await upsertAutomationRun(automationRun)
      })

      describe('status update report', () => {
        const buildReportFunctionRunStatus = () => {
          const report = reportFunctionRunStatusFactory({
            getAutomationFunctionRunRecord: getFunctionRun,
            upsertAutomationFunctionRunRecord: upsertAutomationFunctionRun,
            automationRunUpdater: updateAutomationRun,
            runEventEmit: AutomateRunsEmitter.emit
          })

          return report
        }

        it('fails fn with invalid functionRunId', async () => {
          const report = buildReportFunctionRunStatus()

          const functionRunId = 'nonexistent'
          const params: Parameters<typeof report>[0] = {
            runId: functionRunId,
            status: mapGqlStatusToDbStatus(AutomateRunStatus.Succeeded),
            statusMessage: null,
            results: null,
            contextView: null
          }

          await expect(report(params)).to.eventually.be.rejectedWith(
            FunctionRunNotFoundError
          )
        })

        it('fails fn with invalid status', async () => {
          const report = buildReportFunctionRunStatus()

          const functionRunId = automationRun.functionRuns[0].id
          const params: Parameters<typeof report>[0] = {
            runId: functionRunId,
            status: mapGqlStatusToDbStatus(AutomateRunStatus.Pending),
            statusMessage: null,
            results: null,
            contextView: null
          }

          await expect(report(params)).to.eventually.be.rejectedWith(
            FunctionRunReportStatusError,
            /^Invalid status change/
          )
        })
        ;[
          { val: 1, error: 'invalid type' },
          {
            val: {
              version: '1.0',
              values: { objectResults: [] },
              error: 'invalid version'
            }
          },
          {
            val: {
              version: 1.0,
              values: {}
            },
            error: 'invalid values object'
          },
          {
            val: { version: 1.0, values: { objectResults: [1] } },
            error: 'invalid objectResults item type'
          },
          {
            val: { version: 1.0, values: { objectResults: [{}] } },
            error: 'invalid objectResults item keys'
          }
        ].forEach(({ val, error }) => {
          it('fails fn with invalid results: ' + error, async () => {
            const report = buildReportFunctionRunStatus()

            const functionRunId = automationRun.functionRuns[0].id
            const params: Parameters<typeof report>[0] = {
              runId: functionRunId,
              status: mapGqlStatusToDbStatus(AutomateRunStatus.Succeeded),
              statusMessage: null,
              results: val as unknown as Automate.AutomateTypes.ResultsSchema,
              contextView: null
            }

            await expect(report(params)).to.eventually.be.rejectedWith(
              Automate.UnformattableResultsSchemaError
            )
          })
        })

        it('fails fn with invalid contextView url', async () => {
          const report = buildReportFunctionRunStatus()

          const functionRunId = automationRun.functionRuns[0].id
          const params: Parameters<typeof report>[0] = {
            runId: functionRunId,
            status: mapGqlStatusToDbStatus(AutomateRunStatus.Succeeded),
            statusMessage: null,
            results: null,
            contextView: 'invalid-url'
          }

          await expect(report(params)).to.eventually.be.rejectedWith(
            FunctionRunReportStatusError,
            'Context view must start with a forward slash'
          )
        })

        it('succeeds', async () => {
          const report = buildReportFunctionRunStatus()

          const functionRunId = automationRun.functionRuns[0].id
          const contextView = '/a/b/c'
          const params: Parameters<typeof report>[0] = {
            runId: functionRunId,
            status: mapGqlStatusToDbStatus(AutomateRunStatus.Succeeded),
            statusMessage: null,
            results: null,
            contextView
          }

          await expect(report(params)).to.eventually.be.true

          const [updatedRun, updatedFnRun] = await Promise.all([
            getFullAutomationRunById(automationRun.id),
            getFunctionRun(functionRunId)
          ])

          expect(updatedRun?.status).to.equal(AutomationRunStatuses.succeeded)
          expect(updatedFnRun?.status).to.equal(AutomationRunStatuses.succeeded)
          expect(updatedFnRun?.contextView).to.equal(contextView)
        })
      })
    })
  }
)
