const { scalarSchemas } = require('@/modules/core/graph/scalars')

/**
 * Initial/base schema definition
 */

module.exports = `
  ${scalarSchemas}
  directive @hasScope(scope: String!) on FIELD_DEFINITION
  directive @hasScopes(scopes: [String]!) on FIELD_DEFINITION
  directive @hasRole(role: String!) on FIELD_DEFINITION
  directive @hasStreamRole(role: StreamRole!) on FIELD_DEFINITION

  type Query {
  """
  Stare into the void.
  """
    _: String
  }
  type Mutation{
  """
  The void stares back.
  """
  _: String
  }
  type Subscription{
    """
    It's lonely in the void.
    """
    _: String
  }`
