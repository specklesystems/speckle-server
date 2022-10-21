const { scalarSchemas } = require('@/modules/core/graph/scalars')

/**
 * Initial/base schema definition
 */

module.exports = `
  ${scalarSchemas}

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
