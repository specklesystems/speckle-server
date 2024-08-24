import { expect } from 'chai'
import { redactSensitiveVariables } from '@/logging/loggingHelper'

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
      const result = redactSensitiveVariables(variables)
      expect(result).to.deep.equal({
        email: '[REDACTED]',
        emailaddress: '[REDACTED]',
        // eslint-disable-next-line camelcase
        email_address: '[REDACTED]',
        emails: '[REDACTED]',
        notsensitive: 'exampleValue'
      })
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
      const result = redactSensitiveVariables(variables)
      expect(result).to.deep.equal({
        nest1: {
          email: '[REDACTED]',
          emailaddress: '[REDACTED]',
          // eslint-disable-next-line camelcase
          email_address: '[REDACTED]',
          emails: '[REDACTED]'
        }
      })
    })
    it('should filter sensitive variables in tree structure', () => {
      const variables = {
        nest1: {
          nest2: {
            // eslint-disable-next-line camelcase
            email_address: 'exampleValue',
            emails: 'exampleValue',
            notsensitive: 'exampleValue'
          },
          nest3: {
            email: 'exampleValue',
            emailaddress: 'exampleValue'
          }
        }
      }
      const result = redactSensitiveVariables(variables)
      expect(result).to.deep.equal({
        nest1: {
          nest2: {
            // eslint-disable-next-line camelcase
            email_address: '[REDACTED]',
            emails: '[REDACTED]',
            notsensitive: 'exampleValue'
          },
          nest3: {
            email: '[REDACTED]',
            emailaddress: '[REDACTED]'
          }
        }
      })
    })
  })
})
