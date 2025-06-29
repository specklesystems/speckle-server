import { Logger } from 'pino'
import { execFile } from 'child_process'
import fs from 'fs'

export function runProcessWithTimeout(
  processLogger: Logger,
  cmd: string,
  cmdArgs: string[],
  extraEnv: Record<string, string>,
  timeoutMs: number,
  resultsPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let boundLogger = processLogger.child({ cmd, args: cmdArgs })
    boundLogger.info('Starting process.')
    const childProc = execFile(cmd, cmdArgs, { env: { ...process.env, ...extraEnv } })

    if (!childProc || !childProc.stdout || !childProc.stderr) {
      const rejectionReason = `Error: Could not start child process.`
      const error = new Error(rejectionReason)
      boundLogger.error(error, 'Error starting child process.')
      childProc.kill(9)
      const output = {
        success: false,
        error: rejectionReason
      }
      fs.writeFileSync(resultsPath, JSON.stringify(output))
      reject(new Error(rejectionReason))
      return
    }

    boundLogger = boundLogger.child({ pid: childProc.pid })
    childProc.stdout.on('data', (data) => {
      handleData(data, false, boundLogger)
    })

    childProc.stderr.on('data', (data) => {
      handleData(data, true, boundLogger)
    })

    let timedOut = false

    const timeout = setTimeout(() => {
      boundLogger.warn('Process timed out. Killing process...')

      timedOut = true
      childProc.kill(9)
      const rejectionReason = `Timeout: Process took longer than ${timeoutMs} milliseconds to execute.`
      const output = {
        success: false,
        error: rejectionReason
      }
      fs.writeFileSync(resultsPath, JSON.stringify(output))
      reject(new Error(rejectionReason))
    }, timeoutMs)

    childProc.on('exit', (code) => {
      boundLogger.info({ exitCode: code }, "Process exited with code '{exitCode}'")

      if (timedOut) {
        return // ignore `close` calls after killing (the promise was already rejected)
      }

      clearTimeout(timeout)

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Parser exited with code ${code}`))
      }
    })
  })
}

export function handleData(data: unknown, isErr: boolean, logger: Logger) {
  try {
    if (!Buffer.isBuffer(data)) return
    const dataAsString = data.toString()
    dataAsString.split('\n').forEach((line) => {
      if (!line) return
      try {
        JSON.parse(line) // verify if the data is already in JSON format
        process.stdout.write('\n')
      } catch {
        wrapLogLine(line, isErr, logger)
      }
    })
  } catch {
    wrapLogLine(JSON.stringify(data), isErr, logger)
  }
}

function wrapLogLine(line: string, isErr: boolean, logger: Logger) {
  if (isErr) {
    logger.error({ parserLogLine: line }, 'ParserLog: {parserLogLine}')
    return
  }
  logger.info({ parserLogLine: line }, 'ParserLog: {parserLogLine}')
}
