import { Optional } from '@/modules/shared/helpers/typeHelper'
import { ExecuteOperationResponse } from '@/test/graphqlHelper'
import { AssertionError } from 'chai'
import { isString } from 'lodash'

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
    function (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this: ChaiPluginThis<ExecuteOperationResponse<any>>,
      messageOrOptions?: string | ({ message: string } | { code: string })
    ) {
      const message = isString(messageOrOptions)
        ? messageOrOptions
        : messageOrOptions && 'message' in messageOrOptions
        ? messageOrOptions.message
        : undefined
      const code =
        messageOrOptions && !isString(messageOrOptions) && 'code' in messageOrOptions
          ? messageOrOptions.code
          : undefined

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

        if (message) {
          if (shouldNotHaveErrors) {
            new Assertion(
              errorsArr.map((e) => e.message.toLowerCase()).join('\n')
            ).to.not.contain(message.toLowerCase())
          } else {
            new Assertion(
              errorsArr.map((e) => e.message.toLowerCase()).join('\n')
            ).to.contain(message.toLowerCase())
          }
        }

        if (code) {
          const errorCodes = errorsArr.map((e) => `${e.extensions?.code}`).join('\n')

          if (shouldNotHaveErrors) {
            new Assertion(errorCodes).to.not.contain(code)
          } else {
            new Assertion(errorCodes).to.contain(code)
          }
        }
      } catch (e) {
        if (!(e instanceof AssertionError)) {
          throw e
        }

        const getPrettyErrors = () => `\nErrors: ${JSON.stringify(errorsArr, null, 2)}`

        const msgOrCode = message || code
        let msg = ''
        if (shouldHaveErrors) {
          if (msgOrCode) {
            msg = `Expected GraphQL response to have errors containing "${msgOrCode}", but`
            msg += errorsArr.length
              ? ' only found others' + getPrettyErrors()
              : ' found none'
          } else {
            msg = 'Expected GraphQL response to have errors, but found none'
          }
        } else {
          if (msgOrCode) {
            msg = `Expected GraphQL response to have no errors containing "${msgOrCode}", but found some`
          } else {
            msg = 'Expected GraphQL response to have no errors, but found some'
          }

          msg += getPrettyErrors()
        }

        throw new AssertionError(msg)
      }
    }
  )
}
export default graphqlChaiPlugin
