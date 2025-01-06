import { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { GetWorkspacePlanByProjectId } from '@/modules/gatekeeper/domain/operations'
import {
  isProjectReadOnlyFactory,
  isWorkspaceReadOnlyFactory
} from '@/modules/gatekeeper/services/readOnly'
import { expect } from 'chai'

describe('@gatekeeper readOnly', () => {
  describe('isWorkspaceReadOnlyFactory returns a function that', () => {
    it('returns true if workspace plan status is expired', async () => {
      const getWorkspacePlan: GetWorkspacePlan = () =>
        ({ status: 'expired' } as unknown as ReturnType<GetWorkspacePlan>)

      const isWorkspaceReadOnly = isWorkspaceReadOnlyFactory({ getWorkspacePlan })

      expect(await isWorkspaceReadOnly({ workspaceId: '' })).to.be.true
    })
    it('returns true if workspace plan status is paymentFailed', async () => {
      const getWorkspacePlan: GetWorkspacePlan = () =>
        ({ status: 'paymentFailed' } as unknown as ReturnType<GetWorkspacePlan>)

      const isWorkspaceReadOnly = isWorkspaceReadOnlyFactory({ getWorkspacePlan })

      expect(await isWorkspaceReadOnly({ workspaceId: '' })).to.be.false
    })
    it('returns true if workspace plan status is canceled', async () => {
      const getWorkspacePlan: GetWorkspacePlan = () =>
        ({ status: 'canceled' } as unknown as ReturnType<GetWorkspacePlan>)

      const isWorkspaceReadOnly = isWorkspaceReadOnlyFactory({ getWorkspacePlan })

      expect(await isWorkspaceReadOnly({ workspaceId: '' })).to.be.true
    })
    it('returns false if workspace plan status is trial', async () => {
      const getWorkspacePlan: GetWorkspacePlan = () =>
        ({ status: 'trial' } as unknown as ReturnType<GetWorkspacePlan>)

      const isWorkspaceReadOnly = isWorkspaceReadOnlyFactory({ getWorkspacePlan })

      expect(await isWorkspaceReadOnly({ workspaceId: '' })).to.be.false
    })
    it('returns false if workspace plan status is valid', async () => {
      const getWorkspacePlan: GetWorkspacePlan = () =>
        ({ status: 'valid' } as unknown as ReturnType<GetWorkspacePlan>)

      const isWorkspaceReadOnly = isWorkspaceReadOnlyFactory({ getWorkspacePlan })

      expect(await isWorkspaceReadOnly({ workspaceId: '' })).to.be.false
    })
    it('returns false if workspace plan status is cancelationScheduled', async () => {
      const getWorkspacePlan: GetWorkspacePlan = () =>
        ({ status: 'cancelationScheduled' } as unknown as ReturnType<GetWorkspacePlan>)

      const isWorkspaceReadOnly = isWorkspaceReadOnlyFactory({ getWorkspacePlan })

      expect(await isWorkspaceReadOnly({ workspaceId: '' })).to.be.false
    })
  })

  describe('isProjectReadOnlyFactory returns a function that', () => {
    it('returns false if project is not in a workspace', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () => null

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.false
    })
    it('returns true if workspace plan status is expired', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () =>
        ({
          status: 'expired'
        } as unknown as ReturnType<GetWorkspacePlanByProjectId>)

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.true
    })
    it('returns true if workspace plan status is paymentFailed', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () =>
        ({
          status: 'paymentFailed'
        } as unknown as ReturnType<GetWorkspacePlanByProjectId>)

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.false
    })
    it('returns true if workspace plan status is canceled', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () =>
        ({
          status: 'canceled'
        } as unknown as ReturnType<GetWorkspacePlanByProjectId>)

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.true
    })
    it('returns false if workspace plan status is trial', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () =>
        ({
          status: 'trial'
        } as unknown as ReturnType<GetWorkspacePlanByProjectId>)

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.false
    })
    it('returns false if workspace plan status is valid', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () =>
        ({
          status: 'valid'
        } as unknown as ReturnType<GetWorkspacePlanByProjectId>)

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.false
    })
    it('returns false if workspace plan status is cancelationScheduled', async () => {
      const getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId = async () =>
        ({
          status: 'cancelationScheduled'
        } as unknown as ReturnType<GetWorkspacePlanByProjectId>)

      const isProjectReadOnly = isProjectReadOnlyFactory({
        getWorkspacePlanByProjectId
      })

      expect(await isProjectReadOnly({ projectId: '' })).to.be.false
    })
  })
})
