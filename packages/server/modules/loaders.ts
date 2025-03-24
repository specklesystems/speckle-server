import { LoaderConfigurationError } from '@/modules/shared/errors'
import { Authz } from '@speckle/shared'

let cachedLoaders: Partial<Authz.AuthCheckContextLoaders> = {}

const loaderKeys: (keyof Authz.AuthCheckContextLoaders)[] = [
  'getEnv',
  'getProject',
  'getProjectRole',
  'getServerRole',
  'getWorkspace',
  'getWorkspaceRole',
  'getWorkspaceSsoProvider',
  'getWorkspaceSsoSession'
]

export const defineLoaders = (
  loaders: Partial<Authz.AuthCheckContextLoaders>
): void => {
  for (const key of Object.keys(loaders)) {
    if (!loaderKeys.includes(key as keyof Authz.AuthCheckContextLoaders)) {
      throw new LoaderConfigurationError(
        `Attempted to define loader with unknown key: ${key}`
      )
    }
  }

  cachedLoaders = {
    ...cachedLoaders,
    ...loaders
  }
}

const isValidLoaders = (
  loaders: Partial<Authz.AuthCheckContextLoaders>
): loaders is Authz.AuthCheckContextLoaders => {
  return loaderKeys.every((key) => !!loaders[key])
}

export const validateLoaders = () => {
  if (!isValidLoaders(cachedLoaders)) {
    throw new LoaderConfigurationError()
  }
}

export const getLoaders = (): Authz.AuthCheckContextLoaders => {
  if (!isValidLoaders(cachedLoaders)) {
    throw new LoaderConfigurationError('Attempted to reference invalid loaders.')
  }
  return cachedLoaders
}
