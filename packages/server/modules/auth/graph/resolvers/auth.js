'use strict'
const { authStrategies } = require('../../index')

module.exports = {
  ServerInfo: {
    authStrategies() {
      return authStrategies
    }
  }
}
