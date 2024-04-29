import {
  AutomationCreationError,
  AutomationUpdateError
} from '@/modules/automate/errors/management'
import {
  getAutomation,
  updateAutomation as updateDbAutomation
} from '@/modules/automate/repositories/automations'
import { updateAutomation } from '@/modules/automate/services/automationManagement'
import { expectToThrow } from '@/test/assertionHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  buildAutomationCreate,
  buildAutomationRevisionCreate,
  createTestFunction
} from '@/test/speckle-helpers/automationHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { Automate, Environment, Roles } from '@speckle/shared'
import { expect } from 'chai'

// TODO: Automation create/update

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

const buildAutomationUpdate = () => {
  const update = updateAutomation({
    getAutomation,
    updateAutomation: updateDbAutomation
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
      let createdFunction: Awaited<ReturnType<typeof createTestFunction>>

      before(async () => {
        const createAutomation = buildAutomationCreate()
        const createFunction = createTestFunction

        createdAutomation = await createAutomation({
          input: { name: 'Automation #2', enabled: true },
          projectId: myStream.id,
          userId: me.id
        })
        createdFunction = await createFunction({
          userId: me.id
        })
      })

      it('works successfully', async () => {
        const create = buildAutomationRevisionCreate()

        const ret = await create({
          userId: me.id,
          input: {
            automationId: createdAutomation.automation.id,
            functions: [
              {
                functionReleaseId: createdFunction.release.functionReleaseId,
                parameters: null
              }
            ],
            triggerDefinitions: <Automate.AutomateTypes.TriggerDefinitionsSchema>{
              version: 1.0,
              definitions: [
                {
                  type: 'VERSION_CREATED',
                  modelId: '123'
                }
              ]
            }
          }
        })
        expect(ret).to.be.ok
        expect(ret.id).to.be.ok
        expect(ret.active).to.be.true
        expect(ret.automationId).to.equal(createdAutomation.automation.id)
        expect(ret.triggers.length).to.be.ok
        expect(ret.functions.length).to.be.ok
      })
    })
  }
)
