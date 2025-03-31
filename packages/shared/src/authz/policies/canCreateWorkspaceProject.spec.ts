import { describe, it } from 'vitest'
import {
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { nanoid } from 'nanoid'
import { canCreateWorkspaceProjectPolicy } from './canCreateWorkspaceProject.js'
import { parseFeatureFlags } from '../../environment/index.js'

describe('canCreateWorkspaceProjectPolicy creates a function, that handles', () => {
  describe('server environment configuration by', () => {
    it('forbids creation if the workspaces module is not enabled', async () => {
      // const canCreate = canCreateWorkspaceProjectPolicy({
      //   getEnv: async () => parseFeatureFlags({})
      // })
    })
  })

  describe('user server roles', () => {
    it('forbids creation for unknown users', async () => {

    })
    it('forbids creation for anyone not having minimum server:user role', async () => {

    })
  })

  describe('user workspace roles', () => {
    it('forbids creation for users without a workspace role', async () => {

    })
    it('WorkspaceNotEnoughPermissionsError for workspace guests', async () => {

    })
    it('forbids non-editor seats from creating projects', async () => {

    })
  })

  describe('workspace sso', () => {
    const workspaceSlug = nanoid()
    it.each([
      new WorkspaceNoAccessError(),
      new WorkspaceSsoSessionNoAccessError({ payload: { workspaceSlug } })
    ])('forbids creation with the expected $code', async (err) => {

    })
    it('throws UncoveredError from unexpected sso session errors', async () => {

    })
  })

  describe('workspace limits', () => {
    it('forbids creation if limits fail to load', async () => {

    })
    it('allows creation if plan has no limits', async () => {

    })
    it('forbids creation if current project count fails to load', async () => {

    })
    it('allows creation if new project is within plan limits', async () => {

    })
    it('forbids creation if new project is not within plan limits', async () => {

    })
  })

})
