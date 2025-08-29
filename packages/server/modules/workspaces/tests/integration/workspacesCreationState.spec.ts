import { db } from '@/db/knex'
import type { BasicTestUser } from '@/test/authHelper'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import {
  getWorkspaceFactory,
  getWorkspacesNonCompleteFactory
} from '@/modules/workspaces/repositories/workspaces'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { deleteWorkspacesNonCompleteFactory } from '@/modules/workspaces/services/workspaceCreationState'
import type { Logger } from '@/observability/logging'
import { logger } from '@/observability/logging'
import { getExplicitProjects } from '@/modules/core/repositories/streams'
import { deleteSsoProviderFactory } from '@/modules/workspaces/repositories/sso'
import { deleteAllResourceInvitesFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { deleteWorkspaceFactory as repoDeleteWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { deleteWorkspaceFactory } from '@/modules/workspaces/services/management'
import {
  deleteProjectAndCommitsFactory,
  queryAllProjectsFactory
} from '@/modules/core/services/projects'
import { deleteProjectFactory } from '@/modules/core/repositories/projects'
import { deleteProjectCommitsFactory } from '@/modules/core/repositories/commits'
import { asMultiregionalOperation } from '@/modules/shared/command'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'

const updateAWorkspaceCreatedAt = async (
  workspaceId: string,
  createdAt: dayjs.Dayjs = dayjs()
) => {
  await db
    .table(Workspaces.name)
    .where({ [Workspaces.col.id]: workspaceId })
    .update({ createdAt })
}

describe('WorkspaceCreationState services', () => {
  const getWorkspacesNonComplete = getWorkspacesNonCompleteFactory({ db })
  const getWorkspace = getWorkspaceFactory({ db })
  const deleteWorkspacesNonComplete = async ({ logger }: { logger: Logger }) =>
    asMultiregionalOperation(
      ({ allDbs, mainDb, emit }) => {
        const deleteWorkspacesNonComplete = deleteWorkspacesNonCompleteFactory({
          getWorkspacesNonComplete: getWorkspacesNonCompleteFactory({ db: mainDb }),
          deleteWorkspace: deleteWorkspaceFactory({
            deleteWorkspace: async (...input) => {
              const [res] = await Promise.all(
                allDbs.map((db) => repoDeleteWorkspaceFactory({ db })(...input))
              )

              return res
            },
            deleteProjectAndCommits: deleteProjectAndCommitsFactory({
              deleteProject: async (...input) => {
                const [res] = await Promise.all(
                  allDbs.map((db) => deleteProjectFactory({ db })(...input))
                )

                return res
              },
              deleteProjectCommits: async (...input) => {
                const [res] = await Promise.all(
                  allDbs.map((db) => deleteProjectCommitsFactory({ db })(...input))
                )

                return res
              }
            }),
            deleteAllResourceInvites: deleteAllResourceInvitesFactory({
              db: mainDb
            }),
            queryAllProjects: queryAllProjectsFactory({
              getExplicitProjects: getExplicitProjects({ db: mainDb })
            }),
            deleteSsoProvider: deleteSsoProviderFactory({ db: mainDb }),
            emitWorkspaceEvent: emit
          })
        })

        return deleteWorkspacesNonComplete({ logger })
      },
      {
        logger,
        name: 'deleteWorkspacesNonComplete',
        dbs: await getAllRegisteredDbs()
      }
    )

  let adminUser: BasicTestUser
  let completeWorkspace: BasicTestWorkspace
  let nonCompleteWorkspace: BasicTestWorkspace

  before(async () => {
    adminUser = buildBasicTestUser()
    completeWorkspace = buildBasicTestWorkspace()
    nonCompleteWorkspace = buildBasicTestWorkspace()

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
    await updateAWorkspaceCreatedAt(completeWorkspace.id, dayjs())
    await updateAWorkspaceCreatedAt(nonCompleteWorkspace.id, dayjs())
    const thirtyMinutesAgo = dayjs().subtract(30, 'minutes')

    const workspaces = await getWorkspacesNonComplete({
      createdAtBefore: thirtyMinutesAgo.toDate()
    })

    expect(workspaces).to.have.lengthOf(0)
  })

  it('hits workspaces with complete false when they are 30 mins older', async () => {
    const fortyMinutesAgo = dayjs().subtract(40, 'minutes')
    const thirtyMinutesAgo = dayjs().subtract(30, 'minutes')

    await updateAWorkspaceCreatedAt(completeWorkspace.id, fortyMinutesAgo)
    await updateAWorkspaceCreatedAt(nonCompleteWorkspace.id, fortyMinutesAgo)

    const workspaces = await getWorkspacesNonComplete({
      createdAtBefore: thirtyMinutesAgo.toDate()
    })

    expect(workspaces).to.have.lengthOf(1)
    expect(workspaces).to.deep.eq([{ workspaceId: nonCompleteWorkspace.id }])
  })

  it('deletes only those workspaces that are not completed', async () => {
    const fortyMinutesAgo = dayjs().subtract(40, 'minutes')
    await updateAWorkspaceCreatedAt(completeWorkspace.id, fortyMinutesAgo)
    await updateAWorkspaceCreatedAt(nonCompleteWorkspace.id, fortyMinutesAgo)

    await deleteWorkspacesNonComplete({ logger })

    const workspace1 = await getWorkspace({ workspaceId: completeWorkspace.id })
    const workspace2 = await getWorkspace({ workspaceId: nonCompleteWorkspace.id })
    expect(workspace1).to.exist
    expect(workspace2).to.be.null
  })
})
