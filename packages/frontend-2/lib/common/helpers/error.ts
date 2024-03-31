import { H3Error } from 'h3'

export const isH3Error = (error: unknown): error is H3Error =>
  !!(error && error instanceof H3Error)
