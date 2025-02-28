import { z } from 'zod'
import { parseEnv } from 'znv'

export const {
  REDIS_URL,
  PORT,
  PREVIEW_TIMEOUT,
  PREVIEWS_HEADED,
  CHROMIUM_EXECUTABLE_PATH,
  USER_DATA_DIR,
  LOG_LEVEL,
  LOG_PRETTY
} = parseEnv(process.env, {
  REDIS_URL: z.string().url(),
  PORT: z.number(),
  PREVIEW_TIMEOUT: z.number().default(3600000),
  PREVIEWS_HEADED: z.boolean().default(false),
  CHROMIUM_EXECUTABLE_PATH: z.string(),
  USER_DATA_DIR: z.string(),
  LOG_LEVEL: z.string().default('info'),
  LOG_PRETTY: z.boolean().default(false)
})
