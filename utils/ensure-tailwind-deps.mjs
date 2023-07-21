import mod from 'node:module'
import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { lock, unlock, check } from 'lockfile'

const lockFileName = 'ensure-tailwind-deps.mjs.lock'

/**
 * Build tailwind dependencies only if they don't already exist
 */

const require = mod.createRequire(import.meta.url)
const __dirname = fileURLToPath(dirname(import.meta.url))

const lockFileOpts = { stale: 2 * 60 * 1000 }
const lockFilePath = resolve(__dirname, lockFileName)

async function checkForPresence() {
  try {
    require('@speckle/ui-components')
  } catch (e) {
    // We can't properly require this package from a node environment, so as long as we
    // get to the expected error, we at least know that the package is built and exists
    if (!(e instanceof Error) || !e.message.includes('v3-infinite-loading')) {
      return false
    }
  }

  try {
    require('@speckle/tailwind-theme')
    require('@speckle/shared')
  } catch (e) {
    return false
  }

  return true
}

async function waitForUnlock() {
  return new Promise((resolve, reject) => {
    console.log('Tailwind deps already building...')
    const to = setInterval(() => {
      check(lockFilePath, lockFileOpts, (err, isLocked) => {
        if (err) {
          clearTimeout(to)
          return reject(err)
        }

        if (!isLocked) {
          clearTimeout(to)
          return resolve()
        }
      })
    }, 1000)
  })
}

async function doWork() {
  return new Promise((resolve, reject) => {
    lock(lockFilePath, lockFileOpts, async (err) => {
      if (err) {
        await waitForUnlock()
        return
      }

      const depsExist = await checkForPresence()
      if (depsExist) {
        return resolve()
      }

      // Trigger install
      const now = performance.now()
      console.log('Building tailwind deps...')
      const proc = exec(
        'yarn build:tailwind-deps',
        { cwd: __dirname },
        (err, stdout, stderr) => {
          if (err) {
            console.error(err)
          }
          if (stdout) {
            console.log(stdout)
          }
          if (stderr) {
            console.error(stderr)
          }
        }
      )
      proc.on('exit', (code) => {
        console.log(
          `...done w/ status ${code} [${Math.round(performance.now() - now)}ms]`
        )
        if (!code) {
          resolve()
        } else {
          reject(new Error('Failed with non-0 status code'))
        }
      })
    })
  })
}

async function main() {
  await doWork()
  unlock(lockFilePath, console.error)
}

await main()
