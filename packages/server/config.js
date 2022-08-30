const convict = require('convict')
convict.addFormat(require('convict-format-with-validator').ipaddress)
convict.addFormat(require('convict-format-with-validator').url)

module.exports = function (path) {
  const config = convict(path)
  config.isTestEnv = function () {
    return this.get('env') === 'test'
  }

  config.isDevelopmentEnv = function () {
    return this.get('env') === 'development'
  }

  config.isProductionEnv = function () {
    return this.get('env') === 'production'
  }

  config.isApolloMonitoringEnabled = function () {
    return this.get('apollo.schema_reporting')
  }

  config.apolloServerVersion = function () {
    return this.get('apollo.server_user_version')
  }

  config.getBindAddress = function () {
    // defaults differ depending on the environment
    if (this.isProductionEnv()) {
      return this.get('bind_address') || '0.0.0.0'
    }

    return this.get('bind_address') || '127.0.0.1'
  }

  config.copy = function (fromProperty, toProperty) {
    this.set(toProperty, this.get(fromProperty))
  }

  return config
}
