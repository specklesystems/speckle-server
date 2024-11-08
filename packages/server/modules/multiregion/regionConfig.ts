import { GetAvailableRegionConfig } from '@/modules/multiregion/domain/operations'
import { AllRegionsConfig } from '@/modules/multiregion/domain/types'
import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'

import {
  getMultiRegionConfigPath,
  isDevOrTestEnv
} from '@/modules/shared/helpers/envHelper'
import { type Optional } from '@speckle/shared'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { get } from 'lodash'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'

let multiRegionConfig: Optional<AllRegionsConfig> = undefined

const getAllRegionsConfig = async (): Promise<AllRegionsConfig> => {
  if (isDevOrTestEnv() && !isMultiRegionEnabled()) {
    // this should throw somehow
    return { main: { postgres: { connectionUri: '' } }, regions: {} }
  }
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

  const multiRegionConfigFileResult = multiRegionConfigSchema.safeParse(parsedJson) // This will throw if the config is invalid
  if (!multiRegionConfigFileResult.success)
    throw new MisconfiguredEnvironmentError(
      `Multi-region config file at path '${fullPath}' does not fit the schema`,
      { cause: multiRegionConfigFileResult.error, info: { parsedJson } }
    )

  multiRegionConfig = multiRegionConfigFileResult.data
  return multiRegionConfig
}

export const getMainRegionConfig = async (): Promise<AllRegionsConfig['main']> => {
  return (await getAllRegionsConfig()).main
}

export const getAvailableRegionConfig: GetAvailableRegionConfig = async () => {
  return (await getAllRegionsConfig()).regions
}
