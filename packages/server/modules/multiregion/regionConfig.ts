import { GetAvailableRegionConfig } from '@/modules/multiregion/domain/operations'
import { MultiRegionConfig } from '@/modules/multiregion/domain/types'
import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'
import {
  getMultiRegionConfigPath,
  isDevOrTestEnv
} from '@/modules/shared/helpers/envHelper'
import { ensureError, type Optional } from '@speckle/shared'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { get } from 'lodash'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

export const getAvailableRegionConfig: GetAvailableRegionConfig = async () => {
  if (isDevOrTestEnv() && !isMultiRegionEnabled()) return {}
  if (multiRegionConfig) return multiRegionConfig

  const relativePath = getMultiRegionConfigPath()

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
