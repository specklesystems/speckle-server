import { orderByWeight } from '@/modules/shared/domain/rolesAndScopes/logic'
import coreUserRoles from '@/modules/core/roles'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('orderByWeight', () => {
  it('should return the highest weighted server role first', () => {
    const result = orderByWeight(
      [Roles.Server.Guest, Roles.Server.User, Roles.Server.Admin],
      coreUserRoles
    )
    expect(result[0].name).to.equal(Roles.Server.Admin)
  })

  it('should return the highest weighted stream role first', () => {
    const result = orderByWeight(
      [Roles.Stream.Reviewer, Roles.Stream.Contributor, Roles.Stream.Owner],
      coreUserRoles
    )
    expect(result[0].name).to.equal(Roles.Stream.Owner)
  })

  it('should return the highest weighted workspace role first', () => {
    const result = orderByWeight(
      [Roles.Workspace.Guest, Roles.Workspace.Member, Roles.Workspace.Admin],
      workspaceRoles
    )
    expect(result[0].name).to.equal(Roles.Workspace.Admin)
  })
})
