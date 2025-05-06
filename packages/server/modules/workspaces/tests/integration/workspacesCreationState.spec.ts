import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import {
  deleteWorkspaceFactory,
  getWorkspaceFactory,
  getWorkspacesNonCompleteFactory
} from '@/modules/workspaces/repositories/workspaces'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { deleteWorkspacesNonCompleteFactory } from '@/modules/workspaces/services/workspaceCreationState'
import { logger } from '@/observability/logging'

describe('WorkspaceCreationState services', () => {
  const getWorkspacesNonComplete = getWorkspacesNonCompleteFactory({ db })
  const getWorkspace = getWorkspaceFactory({ db })
  const deleteWorkspacesNonComplete = deleteWorkspacesNonCompleteFactory({
    getWorkspacesNonComplete,
    deleteWorkspace: deleteWorkspaceFactory({ db })
  })

  const adminUser: BasicTestUser = {
    id: '',
    name: createRandomString(),
    email: createRandomEmail()
  }

  const completeWorkspace: BasicTestWorkspace = {
    id: createRandomString(),
    name: createRandomString(),
    slug: createRandomString(),
    ownerId: ''
  }

  const nonCompleteWorkspace: BasicTestWorkspace = {
    id: createRandomString(),
    name: createRandomString(),
    slug: createRandomString(),
    ownerId: ''
  }

  before(async () => {
    await createTestUser(adminUser)
    await createTestWorkspace(completeWorkspace, adminUser, {
      addCreationState: {
        state: {},
        completed: true
      }
    })
    await createTestWorkspace(nonCompleteWorkspace, adminUser, {
      addCreationState: {
        state: {},
        completed: false
      }
    })
  })

  it('does not show completed/impcompleted workspaces when they are recent', async () => {
    await db
      .table(Workspaces.name)
      .where({ [Workspaces.col.id]: completeWorkspace.id })
      .orWhere({ [Workspaces.col.id]: nonCompleteWorkspace.id })
      .update({ createdAt: db.fn.now() })

    const workspaces = await getWorkspacesNonComplete()

    expect(workspaces).to.have.lengthOf(0)
  })

  it('hits workspaces with complete false when they are 30 mins older', async () => {
    const fortyMinutesInThePast = dayjs().subtract(40, 'minutes')
    await db
      .table(Workspaces.name)
      .where({ [Workspaces.col.id]: completeWorkspace.id })
      .orWhere({ [Workspaces.col.id]: nonCompleteWorkspace.id })
      .update({ createdAt: fortyMinutesInThePast })

    const workspaces = await getWorkspacesNonComplete()

    expect(workspaces).to.deep.eq([{ workspaceId: nonCompleteWorkspace.id }])
  })

  it('deletes only those workspaces that are not completed', async () => {
    const fortyMinutesInThePast = dayjs().subtract(40, 'minutes')
    await db
      .table(Workspaces.name)
      .where({ [Workspaces.col.id]: completeWorkspace.id })
      .orWhere({ [Workspaces.col.id]: nonCompleteWorkspace.id })
      .update({ createdAt: fortyMinutesInThePast })

    await deleteWorkspacesNonComplete({ logger })

    const workspace1 = await getWorkspace({ workspaceId: completeWorkspace.id })
    const workspace2 = await getWorkspace({ workspaceId: nonCompleteWorkspace.id })
    expect(workspace1).to.exist
    expect(workspace2).to.be.null
  })
})
