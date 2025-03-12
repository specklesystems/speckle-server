export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export interface Item {
  id: string
  obj: Base
}

export interface Base {
  id: string
  __closure?: string[]
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
