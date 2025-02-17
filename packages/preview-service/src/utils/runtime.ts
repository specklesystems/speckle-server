import path from 'path'
import { fileURLToPath } from 'url'

export const getDirname = (importMetaUrl: string) => {
  const __filename = fileURLToPath(importMetaUrl)
  const __dirname = path.dirname(__filename)

  return __dirname
}
