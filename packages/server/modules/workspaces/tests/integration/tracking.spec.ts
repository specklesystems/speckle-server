import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getAllWorkspacesFactory,
  getWorkspaceSeatCountFactory,
  getWorkspacesProjectsCountsFactory
} from '@/modules/workspaces/repositories/workspaces'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import { updateAllWorkspacesTackingPropertiesFactory } from '@/modules/workspaces/services/tracking'
import { logger } from '@/observability/logging'
import { buildMixpanelFake } from '@/modules/shared/test/helpers/mixpanel'
import { expect } from 'chai'
import { truncateTables } from '@/test/hooks'
import { Workspaces } from '@/modules/workspaces/helpers/db'

describe('Tracking Workspaces', () => {
  const testUser: BasicTestUser = {
    id: createRandomString(),
    name: createRandomString(),
    email: createRandomEmail()
  }

  const updateAllWorkspacesTackingProperties =
    updateAllWorkspacesTackingPropertiesFactory({
      countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
      getDefaultRegion: getDefaultRegionFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
      getWorkspaceModelCount: getWorkspaceModelCountFactory({
        queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
          getStreams: legacyGetStreamsFactory({ db })
        }),
        getPaginatedProjectModelsTotalCount: getPaginatedProjectModelsTotalCountFactory(
          {
            db
          }
        )
      }),
      getWorkspacesProjectCount: getWorkspacesProjectsCountsFactory({ db }),
      getWorkspaceSeatCount: getWorkspaceSeatCountFactory({ db }),
      getAllWorkspaces: getAllWorkspacesFactory({ db })
    })

  before(async () => {
    await truncateTables([Workspaces.name])
    await createTestUser(testUser)
    await Promise.all(
      [...Array(30)].map(() =>
        createTestWorkspace(
          {
            id: createRandomString(),
            ownerId: createRandomString(),
            slug: createRandomString(),
            name: createRandomString()
          },
          testUser
        )
      )
    )
  })

  it('updates all existing workspaces an update workpspace', async () => {
    const fakeStorage: Record<string, object | string> = {}
    const fakeMixpanel = buildMixpanelFake({
      groups: fakeStorage
    })

    await updateAllWorkspacesTackingProperties({ logger, mixpanel: fakeMixpanel })

    expect(Object.keys(fakeStorage).length).to.eq(30)
  })
})
