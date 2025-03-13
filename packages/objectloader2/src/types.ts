export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export interface Item {
  id: string
  obj: Base
}

export interface Base {
  id: string
  __closure?: Record<string, number>
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export class ObjectLoader2Options {
  customLogger?: CustomLogger
}
export class BaseDatabaseOptions {
  enableCaching: boolean = true
}

export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0')

  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}
