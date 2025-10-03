import { db, mainDb } from '@/db/knex'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import {
  getAllWorkspaceChecksumFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { createTestUser, type BasicTestUser } from '@/test/authHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { expect } from 'chai'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  buildBasicTestWorkspace,
  buildTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { truncateTables } from '@/test/hooks'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import { Roles } from '@speckle/shared'
import {
  countWorkspaceUsersFactory,
  getUserWorkspacesWithRoleFactory
} from '@/modules/workspacesCore/repositories/workspaces'

describe('workspaces repository', () => {
  describe('the mechanism to detect that workspace tables have changed @multiregion', () => {
    let user: BasicTestUser

    before(async () => {
      user = await createTestUser()
    })

    it('should return the same checksum if all entries have not changed', async () => {
      await createTestWorkspace(buildBasicTestWorkspace(), user)
      const getAllWorkspaceChecksum = getAllWorkspaceChecksumFactory({ db })

      const checksum = await getAllWorkspaceChecksum()
      const checksum2 = await getAllWorkspaceChecksum()

      expect(checksum).to.be.a('string')
      expect(checksum).to.be.eql(checksum2)
    })

    it('should have a different result on one update', async () => {
      const getAllWorkspaceChecksum = getAllWorkspaceChecksumFactory({ db })

      const checksum = await getAllWorkspaceChecksum()
      await createTestWorkspace(buildBasicTestWorkspace(), user)
      const checksum2 = await getAllWorkspaceChecksum()

      expect(checksum).to.be.a('string')
      expect(checksum).to.not.be.eql(checksum2)
    })

    isMultiRegionTestMode()
      ? describe('workspace checksum ', () => {
          before(async () => {
            await truncateTables([Workspaces.name])
          })

          it('can check equality in two different regions', async () => {
            const region1Db = await getDb({ regionKey: 'region1' })

            for (let i = 0; i < 50; i++) {
              const workspace = buildTestWorkspace()
              await upsertWorkspaceFactory({ db: mainDb })({ workspace })
              await upsertWorkspaceFactory({ db: region1Db })({ workspace })
            }

            const checksum = await getAllWorkspaceChecksumFactory({ db })()
            const checksum2 = await getAllWorkspaceChecksumFactory({ db: region1Db })()

            expect(checksum).to.be.a('string')
            expect(checksum).to.be.eql(checksum2)
          })
        })
      : {}

    describe('countWorkspaceUsersFactory that counts users in a workspace by role', () => {
      let userAdmin: BasicTestUser
      let userMember: BasicTestUser
      let user3: BasicTestUser

      let workspace: BasicTestWorkspace
      let workspace2: BasicTestWorkspace

      const countWorkspaceUsers = countWorkspaceUsersFactory({ db })

      before(async () => {
        userAdmin = await createTestUser()
        userMember = await createTestUser()
        user3 = await createTestUser()

        workspace = await createTestWorkspace(buildBasicTestWorkspace(), user)
        workspace2 = await createTestWorkspace(buildBasicTestWorkspace(), user)

        await assignToWorkspace(workspace, userAdmin, Roles.Workspace.Admin)
        await assignToWorkspace(workspace, userMember, Roles.Workspace.Member)
        await assignToWorkspace(workspace2, user3, Roles.Workspace.Member)
      })

      it('counts the number of users in a workspace', async () => {
        const [totalUsers, totalAdmins, totalMembers] = await Promise.all([
          countWorkspaceUsers({ workspaceId: workspace.id }),
          countWorkspaceUsers({
            workspaceId: workspace.id,
            filter: { workspaceRole: Roles.Workspace.Admin }
          }),
          countWorkspaceUsers({
            workspaceId: workspace.id,
            filter: { workspaceRole: Roles.Workspace.Member }
          })
        ])

        expect(totalUsers).to.be.eq(3)
        expect(totalAdmins).to.be.eq(2)
        expect(totalMembers).to.be.eq(1)
      })
    })

    describe('counts workspaces by a user providing their role', () => {
      let actor: BasicTestUser
      let another: BasicTestUser
      let workspace: BasicTestWorkspace
      let workspace2: BasicTestWorkspace
      let workspace3: BasicTestWorkspace

      const getUserWorkspacesWithRole = getUserWorkspacesWithRoleFactory({ db })

      before(async () => {
        actor = await createTestUser()
        another = await createTestUser()
        workspace = await createTestWorkspace(buildBasicTestWorkspace(), actor)
        workspace2 = await createTestWorkspace(buildBasicTestWorkspace(), another)
        workspace3 = await createTestWorkspace(buildBasicTestWorkspace(), another)

        await assignToWorkspace(workspace2, actor, Roles.Workspace.Member)
        await assignToWorkspace(workspace3, actor, Roles.Workspace.Guest)
      })

      it('retrieves user workspace with this role', async () => {
        const workspaces = await getUserWorkspacesWithRole({ userId: actor.id })

        expect(workspaces).to.have.lengthOf(3)
        expect(workspaces[0]).to.include({
          role: Roles.Workspace.Admin,
          id: workspace.id
        })
        expect(workspaces[1]).to.include({
          role: Roles.Workspace.Member,
          id: workspace2.id
        })
        expect(workspaces[2]).to.include({
          role: Roles.Workspace.Guest,
          id: workspace3.id
        })
      })
    })
  })
})
