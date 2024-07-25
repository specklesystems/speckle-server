import { Optional } from '@/modules/shared/helpers/typeHelper'
import { GraphQLResponse } from 'apollo-server-core'
import { AssertionError } from 'chai'

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
      const { negate, object } = this.__flags
      const { errors } = object

      const shouldNotHaveErrors = negate
      const shouldHaveErrors = !negate

      const errorsArr = errors || []

      try {
        if (shouldNotHaveErrors) {
          new Assertion(errorsArr).to.have.lengthOf(0)
        } else {
          new Assertion(errorsArr).to.have.lengthOf.greaterThanOrEqual(1)
        }

        if (matchMessage) {
          if (shouldNotHaveErrors) {
            new Assertion(
              errorsArr.map((e) => e.message.toLowerCase()).join('\n')
            ).to.not.contain(matchMessage.toLowerCase())
          } else {
            new Assertion(
              errorsArr.map((e) => e.message.toLowerCase()).join('\n')
            ).to.contain(matchMessage.toLowerCase())
          }
        }
      } catch (e) {
        if (!(e instanceof AssertionError)) {
          throw e
        }

        let msg = ''
        if (shouldHaveErrors) {
          if (matchMessage) {
            msg = `Expected GraphQL response to have errors containing "${matchMessage}", but found none`
          } else {
            msg = 'Expected GraphQL response to have errors, but found none'
          }
        } else {
          if (matchMessage) {
            msg = `Expected GraphQL response to have no errors containing "${matchMessage}", but found some`
          } else {
            msg = 'Expected GraphQL response to have no errors, but found some'
          }

          msg += `\nErrors: ${JSON.stringify(errorsArr, null, 2)}`
        }

        throw new AssertionError(msg)
      }
    }
  )
}
export default graphqlChaiPlugin
