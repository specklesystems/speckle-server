'use strict'

let { authStrategies } = require('../../index')

module.exports = {
  ServerInfo: {
    authStrategies() {
      // NOTE: this is an ugly hack as, for some unidentified reason, in the
      // testing env the require above does not f&&&&ing work.
      if (!authStrategies) {
        ;({ authStrategies } = require('../../index'))
      }
      return authStrategies
    }
  }
}
