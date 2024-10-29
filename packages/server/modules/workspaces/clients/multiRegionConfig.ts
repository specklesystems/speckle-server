import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { Optional } from '@speckle/shared'
import { getMultiRegionConfigPath } from '@/modules/shared/helpers/envHelper'
import { z } from 'zod'

const multiRegionConfigSchema = z.record(
  z.string(),
  z.object({
    postgres: z
      .object({
        connectionString: z.string().url(),
        caCertificate: z.string()
      })
      .optional(),
    blobStorage: z
      .object({
        endpoint: z.string().url(),
        accessKey: z.string(),
        secretKey: z.string(),
        bucket: z.string()
      })
      .optional()
  })
)

type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>

let multiRegionConfig: Optional<MultiRegionConfig> = undefined

export const getMultiRegionConfig = async () => {
  if (multiRegionConfig) return multiRegionConfig

  const relativePath = getMultiRegionConfigPath() // This will throw if the path is not set
  const fullPath = path.resolve(packageRoot, relativePath)
  const file = await fs.readFile(fullPath, 'utf-8')

  const parsedJson = JSON.parse(file) // This will throw if the file is not valid JSON

  const multiRegionConfigFileContents = multiRegionConfigSchema.parse(parsedJson) // This will throw if the config is invalid

  multiRegionConfig = multiRegionConfigFileContents
  return multiRegionConfig
}
