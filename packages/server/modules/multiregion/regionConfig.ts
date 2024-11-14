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
} from '@speckle/shared/dist/commonjs/environment/multiRegionConfig.js'

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

const getMultiRegionConfig = async (): Promise<MultiRegionConfig> => {
  const emptyReturn = () => ({ main: { postgres: { connectionUri: '' } }, regions: {} })

  if (isDevOrTestEnv() && !isMultiRegionEnabled()) {
    return emptyReturn()
  }

  if (!multiRegionConfig) {
    const relativePath = getMultiRegionConfigPath({ unsafe: isDevOrTestEnv() })
    if (!relativePath) return emptyReturn()

    const configPath = path.resolve(packageRoot, relativePath)

    multiRegionConfig = await loadMultiRegionsConfig({
      path: configPath
    })
  }

  return multiRegionConfig
}

export const getMainRegionConfig = async (): Promise<MainRegionConfig> => {
  return (await getMultiRegionConfig()).main
}

export const getAvailableRegionConfig: GetAvailableRegionConfig = async () => {
  return (await getMultiRegionConfig()).regions
}
