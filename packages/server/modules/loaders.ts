import { LoaderConfigurationError } from '@/modules/shared/errors'
import { ChuckContextLoaders } from '@speckle/shared'

let cachedLoaders: Partial<ChuckContextLoaders> = {}

const loaderKeys: (keyof ChuckContextLoaders)[] = [
  'getEnv',
  'getProject',
  'getProjectRole',
  'getServerRole',
  'getWorkspace',
  'getWorkspaceRole',
  'getWorkspaceSsoProvider',
  'getWorkspaceSsoSession'
]

export const defineLoaders = (loaders: Partial<ChuckContextLoaders>): void => {
  for (const key of Object.keys(loaders)) {
    if (!loaderKeys.includes(key as keyof ChuckContextLoaders)) {
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
  loaders: Partial<ChuckContextLoaders>
): loaders is ChuckContextLoaders => {
  return loaderKeys.every((key) => !!loaders[key])
}

export const validateLoaders = () => {
  if (!isValidLoaders(cachedLoaders)) {
    throw new LoaderConfigurationError()
  }
}

export const getLoaders = (): ChuckContextLoaders => {
  if (!isValidLoaders(cachedLoaders)) {
    throw new LoaderConfigurationError('Attempted to reference invalid loaders.')
  }
  return cachedLoaders
}
