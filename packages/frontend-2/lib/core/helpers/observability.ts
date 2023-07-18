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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  logger.child = () => logger as any

  return logger
}
