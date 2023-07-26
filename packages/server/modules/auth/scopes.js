'use strict'

const { Scopes } = require('@speckle/shared')

module.exports = [
  {
    name: Scopes.Apps.Read,
    description: 'See what applications you have created or have authorized.',
    public: false
  },
  {
    name: Scopes.Apps.Write,
    description: 'Register applications on your behalf.',
    public: false
  }
]
