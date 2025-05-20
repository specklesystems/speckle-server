import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { canUpdateProjectAllowPublicCommentsPolicy } from './canUpdateAllowPublicComments.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'
import { ProjectNoAccessError } from '../../domain/authErrors.js'
import { getProjectFake } from '../../../tests/fakes.js'
import { ProjectVisibility } from '../../domain/projects/types.js'

describe('canUpdateProjectAllowPublicCommentsPolicy', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof canUpdateProjectAllowPublicCommentsPolicy>
  ) =>
    canUpdateProjectAllowPublicCommentsPolicy({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true'
        }),
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        visibility: ProjectVisibility.Public
      }),
      getProjectRole: async () => Roles.Stream.Owner,
      getServerRole: async () => Roles.Server.User,
      getWorkspace: async () => null,
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      ...overrides
    })

  it('succeeds if public project', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it("fails if can't update at all", async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if project is not public', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        visibility: ProjectVisibility.Private
      })
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })
})
