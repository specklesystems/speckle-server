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

  if (absoluteFileNames.length) {
    // Group filenames by packages
    // TODO: Clean up same file being in multiple packages (app.vue fe2)
    return allPackages
      .map((p) => {
        const filesInPackage = absoluteFileNames.filter((f) =>
          f.startsWith(p.absolutePath)
        )
        return { ...p, files: filesInPackage }
      })
      .filter((c) => !!c.files.length)
  } else {
    return allPackages.map((p) => ({
      ...p,
      files: ['.']
    }))
  }
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
