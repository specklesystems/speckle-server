import { z } from 'zod'
import { parseEnv } from 'znv'

export const {
  REDIS_URL,
  HOST,
  PORT,
  PREVIEW_TIMEOUT,
  PREVIEWS_HEADED,
  CHROMIUM_EXECUTABLE_PATH,
  USER_DATA_DIR,
  LOG_LEVEL,
  LOG_PRETTY
} = parseEnv(process.env, {
  REDIS_URL: z.string().url(),
  HOST: z.string().default('127.0.0.1'), //safely default to localhost in case the env var is not set
  PORT: z.number(),
  PREVIEW_TIMEOUT: z.number().default(3600000),
  PREVIEWS_HEADED: z.boolean().default(false),
  CHROMIUM_EXECUTABLE_PATH: z.string(),
  USER_DATA_DIR: z.string(),
  LOG_LEVEL: z.string().default('info'),
  LOG_PRETTY: z.boolean().default(false)
})
