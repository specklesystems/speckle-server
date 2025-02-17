import path from 'node:path'
import fs from 'node:fs/promises'
import { getESMDirname } from '../eslint.config.mjs'
import * as zx from 'zx'
import events from 'events'

events.setMaxListeners(30)
process.env.FORCE_COLOR = '1'
const rootDir = path.resolve(getESMDirname(import.meta.url), '../')

/**
 * Util to run eslint on the entire monorepo
 * w/o args: run on everything
 * w/ space delimited file names: run on those files
 */

const getFileNames = () => {
  // Read argv file names
  const fileNames = process.argv.slice(2).filter((f) => !['.', '*', '**/*'].includes(f))
  const absoluteFileNames = fileNames.map((f) =>
    path.isAbsolute(f) ? f : path.resolve(process.cwd(), f)
  )
  return absoluteFileNames
}

const resolvePackageContexts = async (absoluteFileNames) => {
  const allPackages = [
    ...(await fs.readdir(path.join(rootDir, './packages'), { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => ({
        absolutePath: path.join(rootDir, './packages', d.name)
      })),
    {
      absolutePath: rootDir
    }
  ]

  if (!absoluteFileNames.length) {
    return allPackages.map((p) => ({
      ...p,
      files: ['.']
    }))
  }

  /**
   * @type {Map<string, Set<string>>}
   */
  const contexts = new Map()

  // Group filenames by packages
  for (const absoluteFileName of absoluteFileNames) {
    const fittingPkgs = allPackages.filter((p) =>
      absoluteFileName.startsWith(p.absolutePath)
    )

    // get pkg w/ longest path to get the most appropriate/fitting one
    fittingPkgs.sort((a, b) => b.absolutePath.length - a.absolutePath.length)
    const pkg = fittingPkgs[0]

    if (!pkg) {
      throw new Error(`File ${absoluteFileName} does not belong to any package`)
    }

    const contextsKey = pkg.absolutePath
    if (!contexts.has(contextsKey)) {
      contexts.set(contextsKey, new Set())
    }
    contexts.get(contextsKey).add(absoluteFileName)
  }

  return [...contexts.entries()].map(([pkgPath, files]) => ({
    absolutePath: pkgPath,
    files: [...files]
  }))
}

const execEslintFromPackageContexts = async (packageContexts) => {
  const ac = new AbortController()

  /** @type {Array<import('zx').ProcessPromise>} */
  const processes = packageContexts.map(async ({ absolutePath, files }) => {
    const exec = zx.$({ cwd: absolutePath, signal: ac.signal })
    const run =
      exec`yarn eslint --cache --max-warnings=0 --no-warn-ignored ${files}`.pipe(
        process.stdout
      )

    return run
  })

  // Wait for all to finish
  const res = await Promise.allSettled(processes)
  const failed = res.filter((r) => r.status === 'rejected')
  if (failed.length) {
    throw failed[0].reason
  }
}

const main = async () => {
  const fileNames = getFileNames()
  const packageContexts = await resolvePackageContexts(fileNames)

  try {
    await execEslintFromPackageContexts(packageContexts)
  } catch (e) {
    if (e instanceof zx.ProcessOutput) {
      console.error('Error occurred while linting')
      process.exit(e.exitCode)
      return
    }

    throw e
  }
}

await main()
