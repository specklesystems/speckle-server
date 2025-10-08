import { InvalidWorkspacePlanStatus } from '@/modules/gatekeeper/errors/billing'
import { updateWorkspacePlanFactory } from '@/modules/gatekeeper/services/workspacePlans'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import type { WorkspaceWithOptionalRole } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import type { WorkspacePlan } from '@speckle/shared'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  UnpaidWorkspacePlans,
  WorkspaceFeatureFlags,
  WorkspacePlans
} from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { omit } from 'lodash-es'
import {
  buildTestWorkspacePlan,
  buildTestWorkspaceSubscription
} from '@/modules/gatekeeper/tests/helpers/workspacePlan'
import { WorkspacePlanStatuses } from '@/modules/core/graph/generated/graphql'

describe('workspacePlan services @gatekeeper', () => {
  describe('updateWorkspacePlanFactory creates a function, that', () => {
    it('throws if the workspace is not found', async () => {
      const updateWorkspacePlan = updateWorkspacePlanFactory({
        getWorkspace: async () => null,
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        getWorkspacePlan: async () => null,
        getWorkspaceSubscription: async () => null,
        emitEvent: () => {
          expect.fail()
        }
      })

      const err = await expectToThrow(async () => {
        await updateWorkspacePlan({
          userId: cryptoRandomString({ length: 10 }),
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
                getWorkspacePlan: async () =>
                  buildTestWorkspacePlan({
                    workspaceId,
                    status: WorkspacePlanStatuses.Valid,
                    name: UnpaidWorkspacePlans.Free
                  }),
                getWorkspaceSubscription: async () => null,
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
              getWorkspacePlan: async () =>
                buildTestWorkspacePlan({
                  workspaceId,
                  status: WorkspacePlanStatuses.Valid,
                  name: UnpaidWorkspacePlans.Free
                }),
              getWorkspaceSubscription: async () => null,
              emitEvent
            })
            await updateWorkspacePlan({
              workspaceId,
              //@ts-expect-error we need to test the runtime error checks too
              name: planName,
              //@ts-expect-error we need to test the runtime error checks too
              status
            })
            const expectedPlan = {
              workspaceId,
              name: planName,
              status,
              featureFlags: WorkspaceFeatureFlags.none
            }
            expect(omit(storedWorkspacePlan, 'createdAt', 'updatedAt')).to.deep.equal(
              expectedPlan
            )
            expect(emittedEventName).to.equal('gatekeeper.workspace-plan-updated')
            expect(eventPayload).to.nested.include({
              'workspacePlan.workspaceId': expectedPlan.workspaceId,
              'workspacePlan.status': expectedPlan.status,
              'workspacePlan.name': expectedPlan.name
            })
          }
        })
      )
    })

    it('does not allow updating if a plan has a current subscription', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })

      const updateWorkspacePlan = updateWorkspacePlanFactory({
        getWorkspace: async () => {
          return { id: workspaceId } as WorkspaceWithOptionalRole
        },
        upsertWorkspacePlan: async () => {},
        getWorkspacePlan: async () =>
          buildTestWorkspacePlan({
            workspaceId,
            name: PaidWorkspacePlans.Team,
            status: WorkspacePlanStatuses.Valid
          }),
        getWorkspaceSubscription: async () => buildTestWorkspaceSubscription(),
        emitEvent: async () => {}
      })

      const update = updateWorkspacePlan({
        userId,
        workspaceId,
        status: WorkspacePlanStatuses.Valid,
        name: WorkspacePlans.Academia
      })

      await expect(update).to.eventually.rejectedWith(
        'Workspace plan cannot be in the specified status'
      )
    })

    it('sends the previous workspace plan in the event payload when present', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
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
            name: PaidWorkspacePlans.Team,
            status: WorkspacePlanStatuses.Valid
          }),
        getWorkspaceSubscription: async () => null,
        emitEvent
      })

      await updateWorkspacePlan({
        userId,
        status: WorkspacePlanStatuses.Valid,
        workspaceId,
        name: PaidWorkspacePlans.ProUnlimited
      })

      expect(emittedEventName).to.equal('gatekeeper.workspace-plan-updated')
      expect(eventPayload).to.nested.include({
        userId,
        'workspacePlan.workspaceId': workspaceId,
        'workspacePlan.status': WorkspacePlanStatuses.Valid,
        'workspacePlan.name': PaidWorkspacePlans.ProUnlimited,
        'previousWorkspacePlan.workspaceId': workspaceId,
        'previousWorkspacePlan.name': PaidWorkspacePlans.Team,
        'previousWorkspacePlan.status': WorkspacePlanStatuses.Valid
      })
    })
  })
})
