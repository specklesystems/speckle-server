/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Observability } from '@speckle/shared'

export function buildFakePinoLogger() {
  const logger = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    fatal: console.error,
    trace: console.debug,
    silent: noop
  } as unknown as ReturnType<typeof Observability.getLogger>

  logger.child = () => logger as any

  return logger
}
