import generateAliasesResolver from 'esm-module-alias'
import { srcRoot } from './root.js'

export const resolve = generateAliasesResolver({
  '@': srcRoot
})
