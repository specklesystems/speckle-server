import path from 'node:path'
import { fileURLToPath } from 'url'

// Conditionally change appRoot and packageRoot according to whether we're running from /dist/ or not (ts-node)
const isTsNode =
  !!process[Symbol.for('ts-node.register.instance')] ||
  process.env.VITEST === 'true' ||
  (process._preload_modules || []).some((m) => m.match(/node_modules\/tsx\//)) // tsx running

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageRoot = __dirname // we know this file is located in the package root
const appRoot = isTsNode ? packageRoot : path.resolve(packageRoot, 'dist')

export { appRoot, packageRoot }
