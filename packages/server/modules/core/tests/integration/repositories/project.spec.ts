import type { BasicTestUser } from '@/test/authHelper'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import { buildBasicTestProject } from '@/modules/core/tests/helpers/creation'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import {
  createTestStream,
  createTestStreams
} from '@/test/speckle-helpers/streamHelper'
import { queryAllProjectsFactory } from '@/modules/core/services/projects'
import { getExplicitProjects } from '@/modules/core/repositories/streams'
import { expect } from 'chai'
import { db } from '@/db/knex'
import {
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

describe('projects repository', () => {
  const workspace = buildBasicTestWorkspace()
  const user = buildBasicTestUser()
  const user2 = buildBasicTestUser()

  before(async () => {
    await createTestUser(user)
    await createTestUser(user2)

    await createTestWorkspace(workspace, user)

    await createTestStream(buildBasicTestProject({ workspaceId: workspace.id }), user)
    await createTestStream(buildBasicTestProject(), user)

    const pairs: [BasicTestStream, BasicTestUser][] = []
    for (let i = 0; i < 150; i++) {
      pairs.push([buildBasicTestProject(), user2])
    }
    await createTestStreams(pairs)
  })

  const queryAllProjects = queryAllProjectsFactory({
    getExplicitProjects: getExplicitProjects({ db })
  })

  it('does not mixup projects from different users', async () => {
    const asyncQueryGenerator = queryAllProjects({
      userId: user.id
    })

    const first = await asyncQueryGenerator.next()

    expect(first.value).to.be.an('array').that.has.lengthOf(2)
  })
  ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
    'is able to query by workspaceId',
    async () => {
      const asyncQueryGenerator = queryAllProjects({
        workspaceId: workspace.id
      })

      const first = await asyncQueryGenerator.next()

      expect(first.value).to.be.an('array').that.has.lengthOf(1)
    }
  )

  it('yield projects in groups of 100', async () => {
    const asyncQueryGenerator = queryAllProjects({
      userId: user2.id
    })

    const first = await asyncQueryGenerator.next()
    const second = await asyncQueryGenerator.next()
    const third = await asyncQueryGenerator.next()

    expect(first.value).to.be.an('array').that.has.lengthOf(100)
    expect(second.value).to.be.an('array').that.has.lengthOf(50)
    expect(third.value).to.be.an('array').that.has.lengthOf(0)
  })
})
