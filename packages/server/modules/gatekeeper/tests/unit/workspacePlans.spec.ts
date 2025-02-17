import { InvalidWorkspacePlanStatus } from '@/modules/gatekeeper/errors/billing'
import { updateWorkspacePlanFactory } from '@/modules/gatekeeper/services/workspacePlans'
import { WorkspacePlan } from '@/modules/gatekeeperCore/domain/billing'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { WorkspaceWithOptionalRole } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { omit } from 'lodash'

describe('workspacePlan services @gatekeeper', () => {
  describe('updateWorkspacePlanFactory creates a function, that', () => {
    it('throws if the workspace is not found', async () => {
      const updateWorkspacePlan = updateWorkspacePlanFactory({
        getWorkspace: async () => null,
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        emitEvent: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await updateWorkspacePlan({
          workspaceId: cryptoRandomString({ length: 10 }),
          name: 'business',
          status: 'expired'
        })
      })
      expect(err.message).to.equal(new WorkspaceNotFoundError().message)
    })
    const uncoveredErrorMessage = 'Uncovered error case'
    const invalidPlanMessage = new InvalidWorkspacePlanStatus().message
    ;(
      [
        { planName: 'foobar', cases: [['trial', uncoveredErrorMessage]] },
        {
          planName: 'starter',
          cases: [
            ['trial', null],
            ['expired', null],
            ['valid', null],
            ['cancelationScheduled', null],
            ['canceled', null],
            ['paymentFailed', null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'business',
          cases: [
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['valid', null],
            ['cancelationScheduled', null],
            ['canceled', null],
            ['paymentFailed', null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'plus',
          cases: [
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['valid', null],
            ['cancelationScheduled', null],
            ['canceled', null],
            ['paymentFailed', null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'academia',
          cases: [
            ['valid', null],
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['cancelationScheduled', invalidPlanMessage],
            ['canceled', invalidPlanMessage],
            ['paymentFailed', invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'unlimited',
          cases: [
            ['valid', null],
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['cancelationScheduled', invalidPlanMessage],
            ['canceled', invalidPlanMessage],
            ['paymentFailed', invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'starterInvoiced',
          cases: [
            ['valid', null],
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['cancelationScheduled', invalidPlanMessage],
            ['canceled', invalidPlanMessage],
            ['paymentFailed', invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'plusInvoiced',
          cases: [
            ['valid', null],
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['cancelationScheduled', invalidPlanMessage],
            ['canceled', invalidPlanMessage],
            ['paymentFailed', invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: 'businessInvoiced',
          cases: [
            ['valid', null],
            ['trial', invalidPlanMessage],
            ['expired', invalidPlanMessage],
            ['cancelationScheduled', invalidPlanMessage],
            ['canceled', invalidPlanMessage],
            ['paymentFailed', invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        }
      ] as const
    ).forEach(({ planName, cases }) => {
      return cases.forEach(([status, expectedErrorMessage]) =>
        it(`${
          expectedErrorMessage ? 'Throws an error' : 'Succeeds'
        } when changing to plan ${planName} with status ${status}`, async () => {
          const fail = () => {
            expect.fail()
          }
          const workspaceId = cryptoRandomString({ length: 10 })
          if (expectedErrorMessage) {
            const err = await expectToThrow(async () => {
              const updateWorkspacePlan = updateWorkspacePlanFactory({
                getWorkspace: async () => {
                  return { id: workspaceId } as WorkspaceWithOptionalRole
                },
                upsertWorkspacePlan: fail,
                emitEvent: fail
              })
              await updateWorkspacePlan({
                workspaceId,
                //@ts-expect-error we need to test the runtime error checks too
                name: planName,
                //@ts-expect-error we need to test the runtime error checks too
                status
              })
            })
            expect(err.message.startsWith(expectedErrorMessage)).to.be.true
          } else {
            let storedWorkspacePlan: WorkspacePlan | undefined = undefined
            let emittedEventName: string | undefined = undefined
            let eventPayload: unknown = undefined

            const upsertWorkspacePlan = async ({
              workspacePlan
            }: {
              workspacePlan: WorkspacePlan
            }) => {
              storedWorkspacePlan = workspacePlan
            }
            const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
              emittedEventName = eventName
              eventPayload = payload
            }
            const updateWorkspacePlan = updateWorkspacePlanFactory({
              getWorkspace: async () => {
                return { id: workspaceId } as WorkspaceWithOptionalRole
              },
              upsertWorkspacePlan,
              emitEvent
            })
            await updateWorkspacePlan({
              workspaceId,
              //@ts-expect-error we need to test the runtime error checks too
              name: planName,
              //@ts-expect-error we need to test the runtime error checks too
              status
            })
            const expectedPlan = { workspaceId, name: planName, status }
            expect(omit(storedWorkspacePlan, 'createdAt')).to.deep.equal(expectedPlan)
            expect(emittedEventName).to.equal('gatekeeper.workspace-plan-updated')
            expect(eventPayload).to.deep.equal({ workspacePlan: expectedPlan })
          }
        })
      )
    })
  })
})
