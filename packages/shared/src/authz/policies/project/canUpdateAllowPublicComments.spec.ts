import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { canUpdateProjectAllowPublicCommentsPolicy } from './canUpdateAllowPublicComments.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'
import { ProjectNoAccessError } from '../../domain/authErrors.js'

describe('canUpdateProjectAllowPublicCommentsPolicy', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof canUpdateProjectAllowPublicCommentsPolicy>
  ) =>
    canUpdateProjectAllowPublicCommentsPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => ({
        id: 'project-id',
        workspaceId: null,
        isDiscoverable: false,
        isPublic: true
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

  it('succeeds if discoverable project', async () => {
    const sut = buildSUT({
      getProject: async () => ({
        id: 'project-id',
        workspaceId: null,
        isDiscoverable: true,
        isPublic: false
      })
    })

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

  it('fails if project is neither public nor discoverable', async () => {
    const sut = buildSUT({
      getProject: async () => ({
        id: 'project-id',
        workspaceId: null,
        isDiscoverable: false,
        isPublic: false
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
