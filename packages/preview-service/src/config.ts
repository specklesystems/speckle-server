import z from 'zod'
import { parseEnv } from 'znv'

export const { REDIS_URL, PORT, PREVIEWS_HEADED, CHROMIUM_EXECUTABLE_PATH } = parseEnv(
  process.env,
  {
    REDIS_URL: z.string().url(),
    PORT: z.number(),
    PREVIEWS_HEADED: z.boolean().default(false),
    CHROMIUM_EXECUTABLE_PATH: z.string()
  }
)
