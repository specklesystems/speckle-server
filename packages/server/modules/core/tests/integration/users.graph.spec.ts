import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  assignToWorkspaces,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser, createTestUsers } from '@/test/authHelper'
import {
  UsersRetrievalDocument,
  UsersRetrievalInput
} from '@/test/graphql/generated/graphql'
import {
  ExecuteOperationOptions,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext, getMainTestRegionKeyIfMultiRegion } from '@/test/hooks'
import { waitForRegionUsers } from '@/test/speckle-helpers/regions'
import {
  addAllToStream,
  BasicTestStream,
  createTestStream,
  createTestStreams
} from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

describe('Users @graphql', () => {
  let me: BasicTestUser = {
    name: 'Itsame mario!',
    email: 'itsame@hehehe.com',
    id: ''
  }
  let apollo: TestApolloServer

  before(async () => {
    await beforeEachContext()
    me = await createTestUser()
    apollo = await testApolloServer({ authUserId: me.id })
    await waitForRegionUsers([me])
  })

  describe('search', () => {
    const RANDOMIZED_USER_COUNT = 20
    const BASIC_COLLABORATOR_PROJECT_USER_COUNT = Math.floor(RANDOMIZED_USER_COUNT / 2)
    const WORKSPACE_COLLABORATOR_USER_COUNT =
      RANDOMIZED_USER_COUNT - BASIC_COLLABORATOR_PROJECT_USER_COUNT
    const WORKSPACE_GUEST_USER_COUNT = FF_WORKSPACES_MODULE_ENABLED
      ? Math.floor(WORKSPACE_COLLABORATOR_USER_COUNT / 3)
      : 0

    const firstSpecificUser: BasicTestUser = {
      name: 'first specific user',
      email: 'lookatmyepicemail@email.com',
      id: ''
    }
    const secondSpecificUser: BasicTestUser = {
      name: 'second specific user',
      email: 'alsolookatmyepicemail@email.com',
      id: ''
    }
    let randomizedUsers: BasicTestUser[]

    const myWorkspace: BasicTestWorkspace = {
      name: 'My Workspace #1',
      ownerId: '',
      id: '',
      slug: ''
    }

    const myWorkspaceCollaboratorProject: BasicTestStream = {
      name: 'My Workspace Collaborator Project #1',
      ownerId: '',
      id: '',
      visibility: ProjectRecordVisibility.Workspace
    }

    const myPrivateWorkspaceCollaboratorProject: BasicTestStream = {
      name: 'My Private Workspace Collaborator Project #1',
      ownerId: '',
      id: '',
      visibility: ProjectRecordVisibility.Private
    }

    const myNoCollaboratorProject: BasicTestStream = {
      name: 'My No Collaborator Project #1',
      ownerId: '',
      id: '',
      visibility: ProjectRecordVisibility.Private
    }

    const myBasicCollaboratorProject: BasicTestStream = {
      name: 'My Basic Collaborator Project #1',
      ownerId: '',
      id: '',
      isPublic: true
    }

    const getBasicRandomizedUsers = () =>
      randomizedUsers.filter((u) => u.name.includes('Basic'))
    const getWorkspaceRandomizedUsers = () =>
      randomizedUsers.filter((u) => u.name.includes('Workspace'))
    const getWorkspaceNonGuestRandomizedUsers = () =>
      getWorkspaceRandomizedUsers().filter((u) => !u.name.includes('Guest'))

    const search = (input: UsersRetrievalInput, options?: ExecuteOperationOptions) =>
      apollo.execute(UsersRetrievalDocument, { input }, options)

    before(async () => {
      await Promise.all([
        createTestStream(myBasicCollaboratorProject, me),
        createTestStream(myNoCollaboratorProject, me),
        createTestWorkspace(myWorkspace, me, {
          regionKey: getMainTestRegionKeyIfMultiRegion()
        })
      ])

      myWorkspaceCollaboratorProject.workspaceId = myWorkspace.id
      myPrivateWorkspaceCollaboratorProject.workspaceId = myWorkspace.id
      await createTestStreams([
        [myWorkspaceCollaboratorProject, me],
        [myPrivateWorkspaceCollaboratorProject, me]
      ])

      // Seed in users
      let remainingBasicProjectCollaborators = BASIC_COLLABORATOR_PROJECT_USER_COUNT
      let remainingWorkspaceGuests = WORKSPACE_GUEST_USER_COUNT

      randomizedUsers = await createTestUsers({
        count: RANDOMIZED_USER_COUNT,
        mapper: ({ user, idx }) => {
          const isBasicProjectCollaborator = remainingBasicProjectCollaborators-- > 0
          const isWorkspaceGuest = !isBasicProjectCollaborator
            ? remainingWorkspaceGuests-- > 0
            : false

          return {
            ...user,
            name: `Randomized ${
              isBasicProjectCollaborator
                ? 'Basic'
                : 'Workspace ' + (isWorkspaceGuest ? 'Guest' : 'Member')
            } User #${idx + 1}`
          }
        },
        serial: true
      })

      // Seed in specific users
      await createTestUsers({
        users: [firstSpecificUser, secondSpecificUser],
        serial: true
      })

      // Assign to projects & workspaces
      const basicProjectCollaborators = [
        ...randomizedUsers.slice(0, BASIC_COLLABORATOR_PROJECT_USER_COUNT),
        firstSpecificUser
      ]
      await addAllToStream(myBasicCollaboratorProject, basicProjectCollaborators, {
        owner: me
      })

      const workspaceCollaborators = [
        ...randomizedUsers.slice(BASIC_COLLABORATOR_PROJECT_USER_COUNT).map((u) => {
          const isGuest = u.name.includes('Guest')
          const role = isGuest ? Roles.Workspace.Guest : Roles.Workspace.Member

          return { user: u, role }
        }),
        { user: secondSpecificUser, role: Roles.Workspace.Member }
      ]

      // Assign to workspaces (or attach to other project)
      if (FF_WORKSPACES_MODULE_ENABLED) {
        await assignToWorkspaces(
          workspaceCollaborators.map(({ user, role }) => [myWorkspace, user, role])
        )
      } else {
        await addAllToStream(
          myWorkspaceCollaboratorProject,
          workspaceCollaborators.map(({ user }) => user),
          {
            owner: me
          }
        )
      }

      // Add specific user to myPrivateWorkspaceCollaboratorProject
      await addAllToStream(
        myPrivateWorkspaceCollaboratorProject,
        [{ user: secondSpecificUser, role: Roles.Stream.Reviewer }],
        {
          owner: me
        }
      )
    })

    it('works with basic query', async () => {
      const res1 = await search(
        {
          query: 'first'
        },
        { assertNoErrors: true }
      )

      expect(res1.data?.users.items || []).to.have.lengthOf(1)
      expect(res1.data?.users.items[0]?.id).to.equal(firstSpecificUser.id)

      const res2 = await search(
        {
          query: 'second'
        },
        { assertNoErrors: true }
      )
      expect(res2.data?.users.items || []).to.have.lengthOf(1)
      expect(res2.data?.users.items[0]?.id).to.equal(secondSpecificUser.id)

      const res3 = await search(
        {
          query: 'specific user'
        },
        { assertNoErrors: true }
      )
      expect(res3.data?.users.items || []).to.have.lengthOf(2)
      expect((res3.data?.users.items || []).map((u) => u.id)).to.have.members([
        firstSpecificUser.id,
        secondSpecificUser.id
      ])
    })

    it('doesnt work with less than 1 character', async () => {
      const res = await search({
        query: ''
      })
      expect(res).to.haveGraphQLErrors('Search query must be at least 1 character')
    })

    it('doesnt work with more than 100 items', async () => {
      const res = await search({
        query: 'user',
        limit: 101
      })
      expect(res).to.haveGraphQLErrors(
        'Cannot return more than 100 items, please use pagination'
      )
    })

    it('works with projectId set', async () => {
      const res = await search(
        {
          query: 'user',
          projectId: myBasicCollaboratorProject.id,
          limit: 100
        },
        { assertNoErrors: true }
      )

      expect(res.data?.users.items || []).to.have.lengthOf(
        BASIC_COLLABORATOR_PROJECT_USER_COUNT + 1 // +1 for the firstSpecificUser
      )
      expect((res.data?.users.items || []).map((u) => u.id)).to.have.members([
        ...getBasicRandomizedUsers().map((u) => u.id),
        firstSpecificUser.id
      ])
    })

    it('works with a workspace visibility projectId from a workspace', async () => {
      const res = await search(
        {
          query: 'user',
          projectId: myWorkspaceCollaboratorProject.id,
          limit: 100
        },
        { assertNoErrors: true }
      )

      // workspace visibility, so: find all members (implicit access) - guests cause none have explicit access + 1 explicit access user
      expect(res.data?.users.items || []).to.have.lengthOf(
        WORKSPACE_COLLABORATOR_USER_COUNT - WORKSPACE_GUEST_USER_COUNT + 1 // +1 for the secondSpecificUser
      )
      expect((res.data?.users.items || []).map((u) => u.id)).to.have.members([
        ...getWorkspaceNonGuestRandomizedUsers().map((u) => u.id),
        secondSpecificUser.id
      ])
    })

    it('works with a private visibility projectId from a workspace', async () => {
      const res = await search(
        {
          query: 'user',
          projectId: myPrivateWorkspaceCollaboratorProject.id,
          limit: 100
        },
        { assertNoErrors: true }
      )

      // private visibility, so: only 1 explicit access user
      expect(res.data?.users.items || []).to.have.lengthOf(1)
      expect((res.data?.users.items || []).map((u) => u.id)).to.deep.equal([
        secondSpecificUser.id
      ])
    })

    it('doesnt work if user doesnt have access to the project specified', async () => {
      const res = await search(
        {
          query: 'user',
          projectId: myNoCollaboratorProject.id,
          limit: 100
        },
        { authUserId: firstSpecificUser.id }
      )

      expect(res).to.haveGraphQLErrors('You do not have access to the project')
      expect(res.data?.users).to.not.be.ok
    })

    it('works with pagination', async () => {
      const totalUserCount = RANDOMIZED_USER_COUNT + 2 // +2 for the specific users
      const firstLimit = Math.floor(totalUserCount / 2)
      const res1 = await search(
        {
          query: 'user',
          limit: firstLimit
        },
        { assertNoErrors: true }
      )

      const firstCursor = res1.data?.users.cursor
      const firstBatch = res1.data?.users.items || []
      expect(firstBatch).to.have.lengthOf(firstLimit)
      expect(firstCursor).to.be.ok

      const secondLimit = totalUserCount - firstLimit
      const res2 = await search(
        {
          query: 'user',
          limit: secondLimit,
          cursor: firstCursor
        },
        { assertNoErrors: true }
      )

      const secondCursor = res2.data?.users.cursor
      const secondBatch = res2.data?.users.items || []
      expect(secondBatch).to.have.lengthOf(secondLimit)
      expect(secondCursor).to.be.ok
      expect([...firstBatch, ...secondBatch].map((u) => u.id)).to.have.members([
        ...randomizedUsers.map((u) => u.id),
        firstSpecificUser.id,
        secondSpecificUser.id
      ])

      const res3 = await search(
        {
          query: 'user',
          limit: 100,
          cursor: secondCursor
        },
        { assertNoErrors: true }
      )

      expect(res3.data?.users.items || []).to.have.lengthOf(0)
      expect(res3.data?.users.cursor).to.be.not.ok
    })
  })
})
