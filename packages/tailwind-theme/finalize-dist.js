import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

/**
 * This adds extra package.jsons inside dist folders to instruct node how to read the build.
 */

const ModuleTypes = {
  CJS: 'CJS',
  ESM: 'ESM'
}

const buildPackageJson = (type) => ({
  type: type === ModuleTypes.ESM ? 'module' : 'commonjs'
})

const main = async () => {
  const root = dirname(fileURLToPath(import.meta.url))

  await fs.writeFile(
    resolve(root, './dist/package.json'),
    JSON.stringify(buildPackageJson(ModuleTypes.ESM))
  )
  await fs.writeFile(
    resolve(root, './dist-cjs/package.json'),
    JSON.stringify(buildPackageJson(ModuleTypes.CJS))
  )
}

await main()
