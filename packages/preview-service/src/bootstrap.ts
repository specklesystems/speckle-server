import generateAliasesResolver from 'esm-module-alias'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

/**
 * Singleton module for src root and package root directory resolution
 */
const __filename = fileURLToPath(import.meta.url)
const srcRoot = path.dirname(__filename)

// Recursively walk back from __dirname till we find our package.json
let packageRoot = srcRoot
while (packageRoot !== '/') {
  if (fs.readdirSync(packageRoot).includes('package.json')) {
    break
  }
  packageRoot = path.resolve(packageRoot, '..')
}

export { srcRoot, packageRoot }

export const resolve = generateAliasesResolver({
  '@': srcRoot,
  '#': path.resolve(packageRoot, './tests')
})
