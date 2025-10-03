import { expect } from 'chai'
import { updateServerInfoFactory } from '@/modules/core/services/server/serverInfo'

describe('serverInfo services @core', () => {
  describe('updateServerInfoFactory creates a function, that', () => {
    it('sanitizises user input', async () => {
      const SUT = updateServerInfoFactory({
        updateServerInfo: async (update) => {
          expect(update.termsOfService).to.eq('I agree to the terms')
          expect(update.adminContact).to.equal('admin@example.com')
          expect(update.name).to.equal('No p0wned server')
          expect(update.company).to.equal('Example Inc.')
          expect(update.description).to.equal('This is a description.')
        }
      })

      await SUT({
        termsOfService: '<script>alert("xss")</script>I agree to the terms',
        adminContact: '<script>alert("xss")</script>admin@example.com',
        name: '<script>alert("xss")</script>No p0wned server',
        company: '<script>alert("xss")</script>Example Inc.',
        description: '<script>alert("xss")</script>This is a description.'
      })
    })
  })
})
