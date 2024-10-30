import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'
import { getMultiRegionConfigPath } from '@/modules/shared/helpers/envHelper'
import type { Optional } from '@speckle/shared'
import type { GetAvailableRegionConfigs } from '@/modules/multiregion/domain/operations'
import { type MultiRegionConfig } from '@/modules/multiregion/domain/types'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

export const getAvailableRegionConfigsFactory =
  (): GetAvailableRegionConfigs => async () => {
    if (multiRegionConfig) return multiRegionConfig

    const relativePath = getMultiRegionConfigPath() // This will throw if the path is not set
    const fullPath = path.resolve(packageRoot, relativePath)
    const file = await fs.readFile(fullPath, 'utf-8')

    const parsedJson = JSON.parse(file) // This will throw if the file is not valid JSON

    const multiRegionConfigFileContents = multiRegionConfigSchema.parse(parsedJson) // This will throw if the config is invalid

    multiRegionConfig = multiRegionConfigFileContents
    return multiRegionConfig
  }
