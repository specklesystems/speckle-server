import { fileURLToPath } from 'url'
import { dirname } from 'path'

/**
 * Feed in import.meta and get the module's filesystem location
 */
export const getModuleDirectory = (meta: ImportMeta): string => {
  const __filename = fileURLToPath(meta.url)
  const __dirname = dirname(__filename)
  return __dirname
}
