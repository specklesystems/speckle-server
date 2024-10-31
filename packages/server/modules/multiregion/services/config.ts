import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'
import {
  getMultiRegionConfigPath,
  isDevOrTestEnv
} from '@/modules/shared/helpers/envHelper'
import type { Optional } from '@speckle/shared'
import type {
  GetAvailableRegionConfigs,
  GetAvailableRegionKeys
} from '@/modules/multiregion/domain/operations'
import { type MultiRegionConfig } from '@/modules/multiregion/domain/types'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

export const getAvailableRegionConfigsFactory =
  (): GetAvailableRegionConfigs => async () => {
    if (multiRegionConfig) return multiRegionConfig

    let relativePath: string

    try {
      relativePath = getMultiRegionConfigPath()
    } catch (e) {
      // Allow path to be undefined in dev and test environments
      if (isDevOrTestEnv() && e instanceof MisconfiguredEnvironmentError) return {}
      throw e
    }

    const fullPath = path.resolve(packageRoot, relativePath)
    const file = await fs.readFile(fullPath, 'utf-8')

    const parsedJson = JSON.parse(file) // This will throw if the file is not valid JSON

    const multiRegionConfigFileContents = multiRegionConfigSchema.parse(parsedJson) // This will throw if the config is invalid

    multiRegionConfig = multiRegionConfigFileContents
    return multiRegionConfig
  }

export const getAvailableRegionKeysFactory = (): GetAvailableRegionKeys => async () => {
  const config = await getAvailableRegionConfigsFactory()()
  return Object.keys(config)
}
