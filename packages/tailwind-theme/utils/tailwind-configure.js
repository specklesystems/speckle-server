import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * Use this to generate an entry for the Tailwind 'content' config key that will ensure
 * this library is scanned to prevent unnecessary purging
 * @returns {string[]}
 */
export function tailwindContentEntries() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  return [
    resolve(__dirname, '../dist', '**/*.{js,cjs,mjs}'),
    resolve(__dirname, '../dist-cjs', '**/*.{js,cjs,mjs}')
  ]
}
