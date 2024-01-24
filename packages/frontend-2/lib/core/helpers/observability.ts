/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Observability } from '@speckle/shared'
import { noop } from 'lodash-es'

export function buildFakePinoLogger(
  options?: Partial<{ onError: (...args: any[]) => void }>
) {
  const errLogger = (...args: unknown[]) => {
    const { onError } = options || {}
    if (onError) onError(...args)
    console.error(...args)
  }

  const logger = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: errLogger,
    fatal: errLogger,
    trace: console.trace,
    silent: noop
  } as unknown as ReturnType<typeof Observability.getLogger>

  logger.child = () => logger as any

  return logger
}
