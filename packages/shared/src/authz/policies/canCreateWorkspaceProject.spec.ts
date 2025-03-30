import { describe, it } from 'vitest'
import {
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { nanoid } from 'nanoid'

describe('canCreateWorkspaceProjectPolicy creates a function, that returns', () => {
  it('WorkspacesNotEnabledError if the workspaces module is not enabled')
  it('ServerNoSessionError for unknown users')
  it('ServerNoAccessError for anyone not having minimum server:user role')
  it('WorkspaceNoAccessError for users without a workspace role')
  it('WorkspaceNotEnoughPermissionsError for workspace guests')
  describe('from sso session checks', () => {
    const workspaceSlug = nanoid()
    it.each([
      new WorkspaceNoAccessError(),
      new WorkspaceSsoSessionNoAccessError({ payload: { workspaceSlug } })
    ])('the expected $code', async () => {})
    it('nothing, instead it throws UncoveredError from unexpected sso session errors')
  })
  describe('seat check results if workspaces new plans is enabled', () => {
    it('')
  })
  it('checks fo')
})
