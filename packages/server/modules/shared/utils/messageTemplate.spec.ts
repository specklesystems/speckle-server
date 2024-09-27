import { expect } from 'chai'
import { prettifyMessage } from '@/modules/shared/utils/messageTemplate'

describe('messageTemplate', () => {
  describe('no templating', () => {
    it('should return the message as is', () => {
      const messageTemplate = 'This is a message'
      const values = {}
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is a message')
    })
    it('should return the message as is, despite the values object', () => {
      const messageTemplate = 'This is a message'
      const values = { key: 'value' }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is a message')
    })
    it.skip('should return the message as is, as brackets are escaped', () => {
      const messageTemplate = 'This is a message with escaped {{key}}'
      const values = { key: 'value' }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is a message with escaped \\{key\\}')
    })
  })
  describe('simple templating', () => {
    it('can handle one string value', () => {
      const messageTemplate = 'This is a {key}'
      const values = { key: 'value' }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is a value')
    })
    it('can handle multiple string values', () => {
      const messageTemplate = 'This is {key1} and {key2}'
      const values = { key1: 'value1', key2: 'value2' }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is value1 and value2')
    })
    it('can handle array value', () => {
      const messageTemplate = 'This is {key}'
      const values = { key: ['value1', 'value2'] }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is ["value1","value2"]')
    })
    it('can handle object value', () => {
      const messageTemplate = 'This is {key}'
      const values = { key: { subKey: 'value' } }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is {"subKey":"value"}')
    })
    it('can handle missing value', () => {
      const messageTemplate = 'This is {key}'
      const values = {}
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is ')
    })
  })
  describe('nested templating', () => {
    it('can handle missing value', () => {
      const messageTemplate = 'This is {key.subKey}'
      const values = {}
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is ')
    })
    it('can handle missing subkey', () => {
      const messageTemplate = 'This is {key.subKey}'
      const values = { key: {} }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is ')
    })
  })
  describe('conditional templating', () => {
    it('can handle conditional with key inside', () => {
      const messageTemplate = 'This is {if key}{key}{end}'
      const values = { key: 'propertyValue' }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is propertyValue')
    })
    it('can handle conditional with random string inside', () => {
      const messageTemplate = 'This is {if key}my lovely horse{end}'
      const values = { key: 'propertyValue' }
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is my lovely horse')
    })
    it('can handle missing value with line trimming', () => {
      const messageTemplate = 'This is {if key}value{end}'
      const values = {}
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is') //lines are trimmed
    })
    it('can handle missing value without line trimming', () => {
      const messageTemplate = 'This is {if key}value{end} without line trimming'
      const values = {}
      const result = prettifyMessage(values, messageTemplate)
      expect(result).to.equal('This is without line trimming')
    })
  })
})
