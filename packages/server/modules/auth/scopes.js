'use strict'

const { Scopes } = require('@speckle/shared')

module.exports = [
  {
    name: Scopes.Apps.Read,
    description: 'See created or authorized applications.',
    public: false
  },
  {
    name: Scopes.Apps.Write,
    description: 'Register new applications.',
    public: false
  }
]
