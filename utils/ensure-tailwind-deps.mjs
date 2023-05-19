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

const lockFileOpts = { stale: 50 * 1000 }
const lockFilePath = resolve(__dirname, lockFileName)

async function checkForPresence() {
  try {
    require('@speckle/tailwind-theme')
    require('@speckle/ui-components')
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
            return reject()
          }

          if (stdout) {
            console.log(stdout)
          }
          if (stderr) {
            console.error(stderr)
          }
        }
      )
      proc.on('exit', () => {
        console.log(`...done [${Math.round(performance.now() - now)}ms]`)
        return resolve()
      })
    })
  })
}

async function main() {
  await doWork()
  unlock(lockFilePath, console.error)
}

await main()
