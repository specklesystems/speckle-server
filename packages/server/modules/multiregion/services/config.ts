import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'
import {
  getMultiRegionConfigPath,
  isDevOrTestEnv
} from '@/modules/shared/helpers/envHelper'
import { ensureError, type Optional } from '@speckle/shared'
import type {
  GetAvailableRegionConfigs,
  GetAvailableRegionKeys,
  GetFreeRegionKeys,
  GetRegions
} from '@/modules/multiregion/domain/operations'
import { type MultiRegionConfig } from '@/modules/multiregion/domain/types'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { get } from 'lodash'

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

    let file: string
    try {
      file = await fs.readFile(fullPath, 'utf-8')
    } catch (e) {
      if (get(e, 'code') === 'ENOENT') {
        throw new MisconfiguredEnvironmentError(
          `Multi-region config file not found at path: ${fullPath}`
        )
      }

      throw e
    }

    let parsedJson: string
    try {
      parsedJson = JSON.parse(file) // This will throw if the file is not valid JSON
    } catch (e) {
      throw new MisconfiguredEnvironmentError(
        `Multi-region config file at path '${fullPath}' is not valid JSON`
      )
    }

    let multiRegionConfigFileContents: MultiRegionConfig
    try {
      multiRegionConfigFileContents = multiRegionConfigSchema.parse(parsedJson) // This will throw if the config is invalid
    } catch (e) {
      throw new MisconfiguredEnvironmentError(
        `Multi-region config file at path '${fullPath}' does not fit the schema`,
        { cause: ensureError(e), info: { parsedJson } }
      )
    }

    multiRegionConfig = multiRegionConfigFileContents
    return multiRegionConfig
  }

export const getAvailableRegionKeysFactory = (): GetAvailableRegionKeys => async () => {
  const config = await getAvailableRegionConfigsFactory()()
  return Object.keys(config)
}

export const getFreeRegionKeysFactory =
  (deps: {
    getAvailableRegionKeys: GetAvailableRegionKeys
    getRegions: GetRegions
  }): GetFreeRegionKeys =>
  async () => {
    const [availableKeys, regions] = await Promise.all([
      deps.getAvailableRegionKeys(),
      deps.getRegions()
    ])

    const usedKeys = regions.map((r) => r.key)
    return availableKeys.filter((k) => !usedKeys.includes(k))
  }
