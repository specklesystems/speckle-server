import { Optional } from '@/modules/shared/helpers/typeHelper'
import { GraphQLResponse } from 'apollo-server-core'

type ChaiPluginThis<O = Record<string, unknown>> = {
  __flags: {
    message: Optional<string>
    negate: Optional<boolean>
    object: O
  }
}

/**
 * Adds various useful assertions for GraphQL API integration tests
 */
const graphqlChaiPlugin: Chai.ChaiPlugin = (_chai, utils) => {
  const { Assertion } = _chai

  utils.addMethod(
    Assertion.prototype,
    'haveGraphQLErrors',
    function (this: ChaiPluginThis<GraphQLResponse>, matchMessage?: string) {
      console.log(this)
      const { negate, object } = this.__flags
      const { errors } = object

      const errorsArr = errors || []

      if (negate) {
        new Assertion(errorsArr).to.have.lengthOf(0)
      } else {
        new Assertion(errorsArr).to.have.lengthOf.greaterThanOrEqual(1)
      }

      if (matchMessage) {
        if (negate) {
          new Assertion(
            errorsArr.map((e) => e.message.toLowerCase()).join('\n')
          ).to.not.contain(matchMessage.toLowerCase())
        } else {
          new Assertion(errorsArr.map((e) => e.message).join('\n')).to.contain(
            matchMessage.toLowerCase()
          )
        }
      }
    }
  )
}
export default graphqlChaiPlugin
