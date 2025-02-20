import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Conditionally change appRoot and packageRoot according to whether we're running from /dist/ or not (ts-node)
const isTsNode = !!process[Symbol.for('ts-node.register.instance')]
const packageRoot = __dirname // we know this file is located in the package root
const appRoot = isTsNode ? packageRoot : path.resolve(packageRoot, 'dist')

export { appRoot, packageRoot }
