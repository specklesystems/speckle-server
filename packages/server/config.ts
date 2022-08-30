import convict from 'convict'
import convictFormatValidations from 'convict-format-with-validator'
convict.addFormat(convictFormatValidations.ipaddress)
convict.addFormat(convictFormatValidations.url)

type ExportedConfig<T> = convict.Config<T> & {
  isTestEnv(): boolean
  isDevelopmentEnv(): boolean
  isProductionEnv(): boolean
  isApolloMonitoringEnabled(): boolean
  apolloServerVersion(): string
  getBindAddress(): string
  copy(fromProperty: string, toProperty: string): void
}

module.exports = function (path: string) {
  const config = convict(path) as unknown as ExportedConfig<string>
  config.isTestEnv = function () {
    return this.get('env' as convict.Path<string>) === 'test'
  }

  config.isDevelopmentEnv = function () {
    return this.get('env' as convict.Path<string>) === 'development'
  }

  config.isProductionEnv = function () {
    return this.get('env' as convict.Path<string>) === 'production'
  }

  config.isApolloMonitoringEnabled = function () {
    return this.get('apollo.schema_reporting' as convict.Path<string>) === 'true'
  }

  config.apolloServerVersion = function (): string {
    return this.get('apollo.server_user_version' as convict.Path<string>) as string
  }

  config.getBindAddress = function (): string {
    // defaults differ depending on the environment
    if (this.isProductionEnv()) {
      return (this.get('bind_address' as convict.Path<string>) as string) || '0.0.0.0'
    }

    return (this.get('bind_address' as convict.Path<string>) as string) || '127.0.0.1'
  }

  config.copy = function (fromProperty: string, toProperty: string): void {
    this.set(toProperty, this.get(fromProperty as convict.Path<string>))
  }

  return config
}
