import path from 'node:path'
import { getModuleDirectory } from '@speckle/shared/environment/node'

// Conditionally change appRoot and packageRoot according to whether we're running from /dist/ or not (ts-node)
const isTsNode =
  !!process[Symbol.for('ts-node.register.instance')] || process.env.VITEST === 'true'
const __dirname = getModuleDirectory(import.meta)

const packageRoot = __dirname // we know this file is located in the package root
const appRoot = isTsNode ? packageRoot : path.resolve(packageRoot, 'dist')

export { appRoot, packageRoot }
