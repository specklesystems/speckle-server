import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory } from '@/modules/workspaces/repositories/projects'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspaces,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser, createTestUsers } from '@/test/authHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { addAllToStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import cryptoRandomString from 'crypto-random-string'
import { db } from '@/db/knex'
import { expect } from 'chai'

describe('intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory returns a function, that', () => {
  const adminUser: BasicTestUser = {
    id: '',
    email: createRandomEmail(),
    name: 'Mr. Workspace'
  }

  const projectUsers: BasicTestUser[] = [
    {
      id: '',
      email: createRandomEmail(),
      name: 'John A. Speckle'
    },
    {
      id: '',
      email: createRandomEmail(),
      name: 'John B. Speckle'
    },
    {
      id: '',
      email: createRandomEmail(),
      name: 'John C. Speckle'
    }
  ]

  const workspaceUsers: BasicTestUser[] = [
    {
      id: '',
      email: createRandomEmail(),
      name: 'John X. Speckle'
    },
    {
      id: '',
      email: createRandomEmail(),
      name: 'John Y. Speckle'
    },
    {
      id: '',
      email: createRandomEmail(),
      name: 'John Z. Speckle'
    }
  ]

  const project: BasicTestStream = {
    id: '',
    ownerId: '',
    name: cryptoRandomString({ length: 9 }),
    isPublic: true
  }

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: cryptoRandomString({ length: 9 }),
    slug: ''
  }

  before(async () => {
    await createTestUser(adminUser)
    await createTestUsers([...projectUsers, ...workspaceUsers])

    await createTestStream(project, adminUser)
    await addAllToStream(project, projectUsers)
    await createTestWorkspace(workspace, adminUser)
    await assignToWorkspaces(workspaceUsers.map((user) => [workspace, user, null]))
  })

  it('returns users that are project members but not members of the target workspace', async () => {
    const result = await intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory({
      db
    })({
      projectId: project.id,
      workspaceId: workspace.id
    })

    expect(result.length).to.equal(3)
    expect(
      result.every((resultUser) =>
        projectUsers.some((projectUser) => projectUser.id === resultUser.id)
      )
    ).to.equal(true)
  })

  it('does not return project users that are already members of the workspace', async () => {
    const result = await intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory({
      db
    })({
      projectId: project.id,
      workspaceId: workspace.id
    })

    expect(
      result.some((resultUser) =>
        workspaceUsers.some((workspaceUser) => workspaceUser.id === resultUser.id)
      )
    ).to.equal(false)
  })

  it('does not return workspace admin or project owner', async () => {
    const result = await intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory({
      db
    })({
      projectId: project.id,
      workspaceId: workspace.id
    })

    expect(result.some((user) => user.id === adminUser.id)).to.equal(false)
  })
})
