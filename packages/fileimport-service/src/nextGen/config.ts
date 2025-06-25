import { z } from 'zod'
import { parseEnv } from 'znv'

export const {
  REDIS_URL,
  QUEUE_NAME,
  FILE_IMPORT_TIME_LIMIT_MIN,
  LOG_LEVEL,
  LOG_PRETTY,
  DOTNET_BINARY_PATH,
  PYTHON_BINARY_PATH,
  RHINO_IMPORTER_PATH
} = parseEnv(process.env, {
  REDIS_URL: z.string().url(),
  QUEUE_NAME: z.string().default('fileimport-service-jobs'),
  FILE_IMPORT_TIME_LIMIT_MIN: z.number().default(30), // minutes
  LOG_LEVEL: z.string().default('info'),
  LOG_PRETTY: z.boolean().default(false),
  DOTNET_BINARY_PATH: z.string().default('dotnet'),
  PYTHON_BINARY_PATH: z.string().default('python3'),
  RHINO_IMPORTER_PATH: z.string().default('rhino-importer.exe')
})
