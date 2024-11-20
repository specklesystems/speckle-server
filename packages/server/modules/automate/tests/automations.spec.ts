import {
  AutomationCreationError,
  AutomationUpdateError
} from '@/modules/automate/errors/management'
import {
  getAutomationFactory,
  updateAutomationFactory
} from '@/modules/automate/repositories/automations'
import { validateAndUpdateAutomationFactory } from '@/modules/automate/services/automationManagement'
import {
  AuthCodePayloadAction,
  createStoredAuthCodeFactory
} from '@/modules/automate/services/authCode'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { ProjectAutomationRevisionCreateInput } from '@/modules/core/graph/generated/graphql'
import { BranchRecord } from '@/modules/core/helpers/types'
import { getLatestStreamBranchFactory } from '@/modules/core/repositories/branches'
import { expectToThrow } from '@/test/assertionHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  AutomateValidateAuthCodeDocument,
  GetProjectAutomationDocument
} from '@/test/graphql/generated/graphql'
import {
  TestApolloServer,
  createTestContext,
  testApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  TestAutomationWithRevision,
  buildAutomationCreate,
  buildAutomationRevisionCreate,
  createTestAutomation,
  generateFunctionId,
  generateFunctionReleaseId,
  truncateAutomations
} from '@/test/speckle-helpers/automationHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { Automate, Roles } from '@speckle/shared'
import { expect } from 'chai'
import { times } from 'lodash'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { AutomationsEmitter } from '@/modules/automate/events/automations'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getUserFactory } from '@/modules/core/repositories/users'

/**
 * TODO: Extra test ideas
 * - Function input validation & matching against an existing function release on exec engine
 * - All of the Automation/Function/Run GQL resolvers
 */

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const getUser = getUserFactory({ db })
const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
})

const buildAutomationUpdate = () => {
  const getAutomation = getAutomationFactory({ db })
  const updateDbAutomation = updateAutomationFactory({ db })
  const update = validateAndUpdateAutomationFactory({
    getAutomation,
    updateAutomation: updateDbAutomation,
    validateStreamAccess,
    automationsEventsEmit: AutomationsEmitter.emit
  })

  return update
}

;(FF_AUTOMATE_MODULE_ENABLED ? describe : describe.skip)(
  'Automations @automate',
  () => {
    const me: BasicTestUser = {
      id: '',
      name: 'Itsa Me!',
      email: 'me@automate.com',
      role: Roles.Server.User
    }

    const otherGuy: BasicTestUser = {
      id: '',
      name: 'Other dude',
      email: 'otherguy@automate.com',
      role: Roles.Server.User
    }

    const myStream: BasicTestStream = {
      id: '',
      name: 'First stream',
      isPublic: true,
      ownerId: ''
    }

    before(async () => {
      await beforeEachContext()
      await createTestUsers([me, otherGuy])
      await createTestStreams([[myStream, me]])
    })

    describe('creation', () => {
      ;[
        { name: '', error: 'too short' },
        { name: 'a'.repeat(256), error: 'too long' }
      ].forEach(({ name, error }) => {
        it(`fails if name is ${error}`, async () => {
          const create = buildAutomationCreate()

          const e = await expectToThrow(
            async () =>
              await create({
                input: { name, enabled: true },
                projectId: myStream.id,
                userId: me.id
              })
          )
          expect(e).to.have.property('name', AutomationCreationError.name)
          expect(e).to.have.property(
            'message',
            'Automation name should be a string between the length of 1 and 255 characters.'
          )
        })
      })

      it('fails if refering to a project that doesnt exist', async () => {
        const create = buildAutomationCreate()

        const e = await expectToThrow(
          async () =>
            await create({
              input: { name: 'Automation', enabled: true },
              projectId: 'non-existent',
              userId: me.id
            })
        )
        expect(e)
          .to.have.property('message')
          .match(/^User does not have required access to stream/)
      })

      it('fails if user does not have access to the project', async () => {
        const create = buildAutomationCreate()

        const e = await expectToThrow(
          async () =>
            await create({
              input: { name: 'Automation', enabled: true },
              projectId: myStream.id,
              userId: otherGuy.id
            })
        )
        expect(e)
          .to.have.property('message')
          .match(/^User does not have required access to stream/)
      })

      it('creates an automation', async () => {
        const create = buildAutomationCreate()

        const automation = await create({
          input: { name: 'Automation #1', enabled: true },
          projectId: myStream.id,
          userId: me.id
        })

        expect(automation).to.be.ok
        expect(automation.automation).to.be.ok
        expect(automation.token).to.be.ok
      })
    })

    describe('updating', () => {
      let createdAutomation: Awaited<
        ReturnType<ReturnType<typeof buildAutomationCreate>>
      >
      const create = buildAutomationCreate()

      before(async () => {
        const create = buildAutomationCreate()
        createdAutomation = await create({
          input: { name: 'Automation #1', enabled: true },
          projectId: myStream.id,
          userId: me.id
        })
      })

      it('fails if refering to an automation that doesnt exist', async () => {
        const update = buildAutomationUpdate()

        const e = await expectToThrow(
          async () =>
            await update({
              input: { id: 'non-existent', enabled: false },
              userId: me.id,
              projectId: myStream.id
            })
        )
        expect(e).to.have.property('name', AutomationUpdateError.name)
        expect(e).to.have.property('message', 'Automation not found')
      })

      it('fails if refering to an automation in a project owned by someone else', async () => {
        const update = buildAutomationUpdate()

        const e = await expectToThrow(
          async () =>
            await update({
              input: { id: createdAutomation.automation.id, enabled: false },
              userId: otherGuy.id,
              projectId: myStream.id
            })
        )
        expect(e)
          .to.have.property('message')
          .match(/^User does not have required access to stream/)
      })

      it('fails if automation is mismatched with specified project id', async () => {
        const update = buildAutomationUpdate()

        const e = await expectToThrow(
          async () =>
            await update({
              input: { id: createdAutomation.automation.id, enabled: false },
              userId: me.id,
              projectId: 'non-existent'
            })
        )
        expect(e).to.have.property('message', 'Automation not found')
      })

      it('only updates set & non-null values', async () => {
        const update = buildAutomationUpdate()
        const { automation: initAutomation } = await create({
          input: { name: 'Automation #2', enabled: true },
          projectId: myStream.id,
          userId: me.id
        })

        const updatedAutomation = await update({
          input: { id: initAutomation.id, enabled: false },
          userId: me.id,
          projectId: myStream.id
        })

        expect(updatedAutomation).to.be.ok
        expect(updatedAutomation.enabled).to.be.false
        expect(updatedAutomation.name).to.equal(initAutomation.name)
      })

      it('updates all available properties', async () => {
        const update = buildAutomationUpdate()
        const { automation: initAutomation } = await create({
          input: { name: 'Automation #3', enabled: true },
          projectId: myStream.id,
          userId: me.id
        })

        const input = {
          id: initAutomation.id,
          name: 'Updated Automation',
          enabled: false
        }
        const updatedAutomation = await update({
          input,
          userId: me.id,
          projectId: myStream.id
        })

        expect(updatedAutomation).to.be.ok
        expect(updatedAutomation.enabled).to.eq(input.enabled)
        expect(updatedAutomation.name).to.equal(input.name)
      })
    })

    describe('revision creation', () => {
      let createdAutomation: Awaited<
        ReturnType<ReturnType<typeof buildAutomationCreate>>
      >
      let projectModel: BranchRecord

      const validAutomationRevisionCreateInput =
        (): ProjectAutomationRevisionCreateInput => ({
          automationId: createdAutomation.automation.id,
          functions: [
            {
              functionReleaseId: generateFunctionReleaseId(),
              functionId: generateFunctionId(),
              parameters: null
            }
          ],
          triggerDefinitions: <Automate.AutomateTypes.TriggerDefinitionsSchema>{
            version: 1.0,
            definitions: [
              {
                type: 'VERSION_CREATED',
                modelId: projectModel.id
              }
            ]
          }
        })

      before(async () => {
        const createAutomation = buildAutomationCreate()

        createdAutomation = await createAutomation({
          input: { name: 'Automation #2', enabled: true },
          projectId: myStream.id,
          userId: me.id
        })
        projectModel = await getLatestStreamBranchFactory({ db })(myStream.id)
      })

      it('works successfully', async () => {
        const create = buildAutomationRevisionCreate()

        const ret = await create({
          userId: me.id,
          input: validAutomationRevisionCreateInput(),
          projectId: myStream.id
        })
        expect(ret).to.be.ok
        expect(ret.id).to.be.ok
        expect(ret.active).to.be.true
        expect(ret.automationId).to.equal(createdAutomation.automation.id)
        expect(ret.triggers.length).to.be.ok
        expect(ret.functions.length).to.be.ok
      })

      it('fails if automation does not exist', async () => {
        const create = buildAutomationRevisionCreate()

        const e = await expectToThrow(
          async () =>
            await create({
              userId: me.id,
              input: {
                ...validAutomationRevisionCreateInput(),
                automationId: 'non-existent'
              },
              projectId: myStream.id
            })
        )
        expect(e).to.have.property('name', AutomationUpdateError.name)
        expect(e).to.have.property('message', 'Automation not found')
      })

      it('fails if user does not have access to the project', async () => {
        const create = buildAutomationRevisionCreate()

        const e = await expectToThrow(
          async () =>
            await create({
              userId: otherGuy.id,
              input: validAutomationRevisionCreateInput(),
              projectId: myStream.id
            })
        )
        expect(e)
          .to.have.property('message')
          .match(/^User does not have required access to stream/)
      })

      it('fails if automation is mismatched with specified project id', async () => {
        const create = buildAutomationRevisionCreate()

        const e = await expectToThrow(
          async () =>
            await create({
              userId: me.id,
              input: validAutomationRevisionCreateInput(),
              projectId: 'non-existent'
            })
        )
        expect(e).to.have.property('message', 'Automation not found')
      })
      ;[
        { val: null, error: 'null object' },
        { val: {}, error: 'empty object' },
        { val: { version: 1.0 }, error: 'missing definitions' },
        { val: { version: '1.0', error: 'non-numeric version' } },
        { val: { version: 1.0, definitions: null }, error: 'null definitions' },
        {
          val: { version: 1.0, definitions: [null] },
          error: 'null definition'
        },
        {
          val: { version: 1.0, definitions: [{}] },
          error: 'empty definition'
        },
        {
          val: { version: 1.0, definitions: [{ type: 'VERSION_CREATED' }] },
          error: 'missing modelId'
        },
        {
          val: { version: 1.0, definitions: [{ type: 'aaaa', modelId: '123' }] },
          error: 'invalid trigger'
        }
      ].forEach(({ val, error }) => {
        it('fails with invalid trigger definitions: ' + error, async () => {
          const create = buildAutomationRevisionCreate()

          const e = await expectToThrow(
            async () =>
              await create({
                userId: me.id,
                input: {
                  ...validAutomationRevisionCreateInput(),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  triggerDefinitions: val as any
                },
                projectId: myStream.id
              })
          )

          expect(
            e instanceof Automate.UnformattableTriggerDefinitionSchemaError,
            e.toString()
          ).to.be.true
        })
      })

      it('fails if empty trigger definitions', async () => {
        const create = buildAutomationRevisionCreate()

        const e = await expectToThrow(
          async () =>
            await create({
              userId: me.id,
              input: {
                ...validAutomationRevisionCreateInput(),
                triggerDefinitions: { version: 1.0, definitions: [] }
              },
              projectId: myStream.id
            })
        )

        expect(e.message).to.eq('At least one trigger definition is required')
      })

      it('fails with invalid function parameters', async () => {
        const create = buildAutomationRevisionCreate()

        const input = validAutomationRevisionCreateInput()
        input.functions.forEach((fn) => {
          fn.parameters = '{invalid'
        })

        const e = await expectToThrow(
          async () =>
            await create({
              userId: me.id,
              input,
              projectId: myStream.id
            })
        )

        expect(e.message).to.match(/^Failed to decrypt one or more function/i)
      })

      it('fails when refering to nonexistent function releases', async () => {
        const create = buildAutomationRevisionCreate({
          getFunctionRelease: async () => {
            // TODO: Update once we know how exec engine should respond
            throw new Error('Function release with ID XXX not found')
          }
        })

        const input = validAutomationRevisionCreateInput()
        input.functions.forEach((fn) => {
          fn.functionReleaseId = 'non-existent'
        })

        const e = await expectToThrow(
          async () =>
            await create({
              userId: me.id,
              input,
              projectId: myStream.id
            })
        )

        expect(e.message).to.match(/^Function release with ID .*? not found/)
      })
    })

    describe('auth code handshake', () => {
      let apollo: TestApolloServer

      before(async () => {
        apollo = await testApolloServer() // unauthenticated
      })

      it('fails if code is invalid', async () => {
        const res = await apollo.execute(AutomateValidateAuthCodeDocument, {
          payload: {
            code: 'invalid',
            userId: 'a',
            action: 'aty'
          }
        })

        expect(res).to.haveGraphQLErrors('Invalid automate auth payload')
        expect(res.data?.automateValidateAuthCode).to.not.be.ok
      })

      it('succeeds with valid code', async () => {
        const storeCode = createStoredAuthCodeFactory({
          redis: getGenericRedis()
        })
        const code = await storeCode({
          userId: me.id,
          action: AuthCodePayloadAction.BecomeFunctionAuthor
        })

        const res = await apollo.execute(AutomateValidateAuthCodeDocument, {
          payload: code
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.automateValidateAuthCode).to.be.true
      })
    })

    describe.skip('retrieval', () => {
      let apollo: TestApolloServer

      const someCollaborator: BasicTestUser = {
        id: '',
        name: 'Collaborator dude',
        email: 'otherguy2@automate.com',
        role: Roles.Server.User
      }

      const TOTAL_AUTOMATION_COUNT = 20
      // const SEARCH_STRING = 'bababooey'
      // const PAGINATION_LIMIT = Math.floor(TOTAL_AUTOMATION_COUNT / 3) // ~3 pages
      // const ITEMS_W_SEARCH_STRING = Math.floor(TOTAL_AUTOMATION_COUNT / 4)

      let testAutomations: TestAutomationWithRevision[]

      before(async () => {
        await truncateAutomations()

        await createTestUsers([someCollaborator])
        await addOrUpdateStreamCollaborator(
          myStream.id,
          someCollaborator.id,
          Roles.Stream.Contributor,
          me.id
        )

        apollo = await testApolloServer({
          context: await createTestContext({
            userId: me.id,
            token: 'abc',
            role: Roles.Server.User
          })
        })

        testAutomations = await Promise.all(
          times(TOTAL_AUTOMATION_COUNT, async (i) =>
            createTestAutomation({
              userId: me.id,
              projectId: myStream.id,
              automation: {
                name: `Retrieval Test Automation #${i}`
              },
              revision: {
                functionId: generateFunctionId(),
                functionReleaseId: generateFunctionReleaseId()
              }
            })
          )
        )
      })

      describe('when retrieving single automation', () => {
        it('fails if user is not the owner of the project', async () => {
          const res = await apollo.execute(GetProjectAutomationDocument, {
            projectId: myStream.id,
            automationId: testAutomations[0].automation.automation.id
          })

          expect(res).to.haveGraphQLErrors('Not allowed')
          expect(res.data?.project).to.be.ok
          expect(res.data?.project?.automation).to.not.be.ok
        })
      })
    })
  }
)
