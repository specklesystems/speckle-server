'use strict'
const { Scopes } = require('@/modules/core/helpers/mainConstants')

module.exports = [
  {
    name: Scopes.Users.Invite,
    description: 'Invite others to join this server.',
    public: false
  }
]
