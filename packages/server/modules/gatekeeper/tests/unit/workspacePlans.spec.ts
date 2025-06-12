import { InvalidWorkspacePlanStatus } from '@/modules/gatekeeper/errors/billing'
import { updateWorkspacePlanFactory } from '@/modules/gatekeeper/services/workspacePlans'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { WorkspaceWithOptionalRole } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  UnpaidWorkspacePlans,
  WorkspacePlan
} from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { omit } from 'lodash'
import { buildTestWorkspacePlan } from '@/modules/gatekeeper/tests/helpers/workspacePlan'
import { WorkspacePlanStatuses } from '@/modules/cross-server-sync/graph/generated/graphql'

describe('workspacePlan services @gatekeeper', () => {
  describe('updateWorkspacePlanFactory creates a function, that', () => {
    it('throws if the workspace is not found', async () => {
      const updateWorkspacePlan = updateWorkspacePlanFactory({
        getWorkspace: async () => null,
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        getWorkspacePlan: async () => null,
        emitEvent: () => {
          expect.fail()
        }
      })

      const err = await expectToThrow(async () => {
        await updateWorkspacePlan({
          workspaceId: cryptoRandomString({ length: 10 }),
          name: PaidWorkspacePlans.Team,
          status: PaidWorkspacePlanStatuses.Canceled
        })
      })
      expect(err.message).to.equal(new WorkspaceNotFoundError().message)
    })
    const uncoveredErrorMessage = 'Uncovered error case'
    const invalidPlanMessage = new InvalidWorkspacePlanStatus().message
    ;(
      [
        {
          planName: 'foobar',
          cases: [[PaidWorkspacePlanStatuses.Canceled, uncoveredErrorMessage]]
        },
        {
          planName: PaidWorkspacePlans.Team,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, null],
            [PaidWorkspacePlanStatuses.Canceled, null],
            [PaidWorkspacePlanStatuses.PaymentFailed, null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: PaidWorkspacePlans.Pro,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, null],
            [PaidWorkspacePlanStatuses.Canceled, null],
            [PaidWorkspacePlanStatuses.PaymentFailed, null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: PaidWorkspacePlans.TeamUnlimited,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, null],
            [PaidWorkspacePlanStatuses.Canceled, null],
            [PaidWorkspacePlanStatuses.PaymentFailed, null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: PaidWorkspacePlans.ProUnlimited,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, null],
            [PaidWorkspacePlanStatuses.Canceled, null],
            [PaidWorkspacePlanStatuses.PaymentFailed, null],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: UnpaidWorkspacePlans.Academia,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.Canceled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.PaymentFailed, invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: UnpaidWorkspacePlans.Free,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.Canceled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.PaymentFailed, invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: UnpaidWorkspacePlans.Unlimited,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.Canceled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.PaymentFailed, invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: UnpaidWorkspacePlans.TeamUnlimitedInvoiced,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.Canceled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.PaymentFailed, invalidPlanMessage],
            ['foobar', uncoveredErrorMessage]
          ]
        },
        {
          planName: UnpaidWorkspacePlans.ProUnlimitedInvoiced,
          cases: [
            [PaidWorkspacePlanStatuses.Valid, null],
            [PaidWorkspacePlanStatuses.CancelationScheduled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.Canceled, invalidPlanMessage],
            [PaidWorkspacePlanStatuses.PaymentFailed, invalidPlanMessage],
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
                getWorkspacePlan: async () => null,
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
              getWorkspacePlan: async () => null,
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
            expect(omit(storedWorkspacePlan, 'createdAt', 'updatedAt')).to.deep.equal(
              expectedPlan
            )
            expect(emittedEventName).to.equal('gatekeeper.workspace-plan-updated')
            expect(eventPayload).to.deep.equal({
              workspacePlan: {
                ...expectedPlan
              }
            })
          }
        })
      )
    })

    it('sends the previous workspace plan in the event payload when present', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      let emittedEventName: string | undefined = undefined
      let eventPayload: unknown = undefined
      const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        eventPayload = payload
      }

      const updateWorkspacePlan = updateWorkspacePlanFactory({
        getWorkspace: async () => {
          return { id: workspaceId } as WorkspaceWithOptionalRole
        },
        upsertWorkspacePlan: async () => {},
        getWorkspacePlan: async () =>
          buildTestWorkspacePlan({
            workspaceId,
            name: PaidWorkspacePlans.Team
          }),
        emitEvent
      })

      await updateWorkspacePlan({
        status: WorkspacePlanStatuses.Valid,
        workspaceId,
        name: PaidWorkspacePlans.ProUnlimited
      })

      expect(emittedEventName).to.equal('gatekeeper.workspace-plan-updated')
      expect(eventPayload).to.deep.equal({
        workspacePlan: {
          workspaceId,
          status: WorkspacePlanStatuses.Valid,
          name: PaidWorkspacePlans.ProUnlimited
        },
        previousPlan: {
          name: PaidWorkspacePlans.Team
        }
      })
    })
  })
})
