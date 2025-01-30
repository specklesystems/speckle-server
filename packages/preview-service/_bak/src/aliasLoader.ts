import generateAliasesResolver from 'esm-module-alias'
import { packageRoot, srcRoot } from './root.js'
import path from 'node:path'

export const resolve = generateAliasesResolver({
  '@': srcRoot,
  '#': path.resolve(packageRoot, './tests')
})
