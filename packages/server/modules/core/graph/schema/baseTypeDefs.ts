import { scalarSchemas } from '@/modules/core/graph/scalars'

/**
 * Initial/base schema definition
 */

const baseTypeDefs = `
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

export default baseTypeDefs
