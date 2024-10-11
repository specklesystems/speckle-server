import mod from 'node:module'
import { spawn } from 'node:child_process'
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
const debug = process.env.DEBUG === 'true' || !!process.env.CI

const buildLogger = (childProcessPid) => {
  const log = console.log
  const error = console.error
  const pid = process.pid

  const timestamp = () => new Date().toISOString()
  const buildPrefix = () =>
    `[${pid}${
      childProcessPid ? '-' + childProcessPid : ''
    }][ensure-tailwind-deps][${timestamp()}]: `
  const argsFilter = (a) => debug || !(a instanceof Error)

  return {
    log: (...args) => log(buildPrefix(), ...args.filter(argsFilter)),
    error: (...args) => error(buildPrefix(), ...args.filter(argsFilter)),
    fatal: (...args) => error(buildPrefix(), ...args)
  }
}
const logger = buildLogger()

async function checkForPresence() {
  logger.log('Checking for tailwind dependency presence...')

  try {
    require('@speckle/ui-components')
  } catch (e) {
    // We can't properly require this package from a node environment, so as long as we
    // get to the expected error, we at least know that the package is built and exists
    if (!(e instanceof Error) || !e.message.includes('v3-infinite-loading')) {
      logger.log('@speckle/ui-components needs a rebuild', e)
      return false
    }
  }

  try {
    require('@speckle/tailwind-theme')
    require('@speckle/shared')
  } catch (e) {
    logger.log('@speckle/shared or @speckle/tailwind-theme needs a rebuild', e)
    return false
  }

  return true
}

async function waitForUnlock() {
  return new Promise((resolve, reject) => {
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
        const isLockTaken = err?.message.includes('file already exists')
        if (isLockTaken) {
          logger.log('Tailwind deps already building, wait...')
          await waitForUnlock()
          return resolve()
        } else {
          logger.fatal('Failed to lock', err)
          return reject(err)
        }
      }

      const depsExist = await checkForPresence()
      if (depsExist) {
        logger.log('Tailwind deps already built, we are done!')
        return resolve()
      }

      // Trigger install
      const now = performance.now()
      logger.log('Building tailwind deps...')

      const proc = spawn('yarn', ['build:tailwind-deps'], { cwd: __dirname })
      const childLogger = buildLogger(proc.pid)
      proc.stdout.on('data', (data) =>
        childLogger.log(data?.toString ? data.toString() : data)
      )
      proc.stderr.on('data', (data) =>
        childLogger.error(data?.toString ? data.toString() : data)
      )
      proc.on('close', (code) => {
        logger.log(
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
  unlock(lockFilePath, (err) => {
    if (err) {
      logger.fatal('Failed to unlock', err)
    }
  })
  logger.log('Bye bye!')
}

await main().catch((e) => {
  logger.fatal('Process failed', e)
  process.exit(1)
})
