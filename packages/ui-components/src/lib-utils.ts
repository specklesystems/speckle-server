import { resolve, dirname } from 'path'

/**
 * Use this to generate an entry for the Tailwind 'content' config key that will ensure
 * this library is scanned to prevent unnecessary purging
 * @param {NodeRequire} req Feed in the 'require' object. It needs to be fed in because it may be
 * unavailable in certain environments and might need to be created manually with 'createRequire'
 */
export function tailwindContentEntry(req: NodeRequire) {
  const packageLocaton = req.resolve('@speckle/ui-components')
  const packageDir = dirname(packageLocaton)
  return resolve(packageDir, '**/*.{js,cjs,mjs}')
}
