import { GetAvailableRegionConfig } from '@/modules/multiregion/domain/operations'
import { packageRoot } from '@/bootstrap'
import path from 'node:path'

import {
  getMultiRegionConfigPath,
  isDevOrTestEnv
} from '@/modules/shared/helpers/envHelper'
import { type Optional } from '@speckle/shared'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import {
  MainRegionConfig,
  MultiRegionConfig,
  loadMultiRegionsConfig
} from '@speckle/shared/environment/db'

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

const getMultiRegionConfig = async (): Promise<MultiRegionConfig> => {
  // Only for non region enabled dev envs
  const emptyReturn = (): MultiRegionConfig => ({
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
