import { LoaderConfigurationError } from '@/modules/shared/errors'
import { Authz } from '@speckle/shared'
import { difference } from 'lodash'

let cachedLoaders: Partial<Authz.AuthCheckContextLoaders> = {}

const loaderKeys = Object.values(Authz.AuthCheckContextLoaderKeys)

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

export const validateLoaders = () => {
  const notFoundKeys = difference(loaderKeys, Object.keys(cachedLoaders))
  if (notFoundKeys.length) {
    throw new LoaderConfigurationError(
      `Attempted to start app with missing loaders: ${notFoundKeys.join(', ')}`
    )
  }
}

export const getLoaders = (): Authz.AuthCheckContextLoaders => {
  validateLoaders()
  return cachedLoaders as Authz.AuthCheckContextLoaders
}
