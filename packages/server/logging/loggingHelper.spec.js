const expect = require('chai').expect
const { filterSensitiveVariables } = require('@/logging/loggingHelper')

describe('loggingHelper', () => {
  describe('filterSensitiveVariables', () => {
    it('should filter sensitive variables at root', () => {
      const variables = {
        email: 'exampleValue',
        emailaddress: 'exampleValue',
        // eslint-disable-next-line camelcase
        email_address: 'exampleValue',
        emails: 'exampleValue',
        notsensitive: 'exampleValue'
      }
      const result = filterSensitiveVariables(variables)
      expect(result).to.deep.equal({ notsensitive: 'exampleValue' })
    })
    it('should filter nested sensitive variables', () => {
      const variables = {
        nest1: {
          email: 'exampleValue',
          emailaddress: 'exampleValue',
          // eslint-disable-next-line camelcase
          email_address: 'exampleValue',
          emails: 'exampleValue'
        }
      }
      const result = filterSensitiveVariables(variables)
      expect(result).to.deep.equal({ nest1: {} })
    })
    it('should filter deeply nested sensitive variables', () => {
      const variables = {
        nest1: {
          email: 'exampleValue',
          emailaddress: 'exampleValue',
          // eslint-disable-next-line camelcase
          email_address: 'exampleValue',
          emails: 'exampleValue',
          notsensitive: 'exampleValue'
        }
      }
      const result = filterSensitiveVariables(variables)
      expect(result).to.deep.equal({ nest1: { notsensitive: 'exampleValue' } })
    })
  })
})
