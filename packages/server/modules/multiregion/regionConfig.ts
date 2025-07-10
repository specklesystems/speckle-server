import { GetAvailableRegionConfig } from '@/modules/multiregion/domain/operations'
import { packageRoot } from '@/bootstrap'
import path from 'node:path'

import {
  getMultiRegionConfigPath,
  isDevOrTestEnv,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { type Optional } from '@speckle/shared'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import {
  MainRegionConfig,
  MultiRegionConfig,
  loadMultiRegionsConfig
} from '@speckle/shared/environment/db'
import { TestOnlyLogicError } from '@/modules/shared/errors'
import { PartialDeep } from 'type-fest'
import { merge } from 'lodash-es'

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

const emptyConfig = (): MultiRegionConfig => ({
  main: {
    postgres: { connectionUri: '' },
    blobStorage: {
      accessKey: '',
      secretKey: '',
      endpoint: '',
      s3Region: '',
      bucket: '',
      createBucketIfNotExists: true
    }
  },
  regions: {}
})

export const getMultiRegionConfig = async (): Promise<MultiRegionConfig> => {
  // Only for non region enabled dev envs
  const emptyReturn = () => emptyConfig()

  if (!multiRegionConfig) {
    const relativePath = getMultiRegionConfigPath({ unsafe: isDevOrTestEnv() })
    if (!relativePath) return emptyReturn()

    const configPath = path.resolve(packageRoot, relativePath)

    try {
      multiRegionConfig = await loadMultiRegionsConfig({
        path: configPath
      })
    } catch (e) {
      if (isDevOrTestEnv() && !isMultiRegionEnabled()) {
        return emptyReturn()
      } else {
        throw e
      }
    }
  }

  return multiRegionConfig
}

export const getMainRegionConfig = async (): Promise<MainRegionConfig> => {
  return (await getMultiRegionConfig()).main
}

export const getAvailableRegionConfig: GetAvailableRegionConfig = async () => {
  return (await getMultiRegionConfig()).regions
}

export const getDefaultProjectRegionKey = async (): Promise<string | null> => {
  if (!isMultiRegionEnabled()) return null
  const defaultRegionKey = (await getMultiRegionConfig()).defaultProjectRegionKey
  return defaultRegionKey ?? null
}

export const setMultiRegionConfig = (
  config: Optional<PartialDeep<MultiRegionConfig>>
) => {
  if (!isTestEnv()) {
    throw new TestOnlyLogicError()
  }

  multiRegionConfig = config ? merge({}, emptyConfig(), config) : undefined
}
