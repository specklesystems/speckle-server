export type CheckResponse = { isAlive: true } | { isAlive: false; err: unknown }
export type RedisCheck = () => Promise<CheckResponse>
export type MultiDBCheck = () => Promise<Record<string, CheckResponse>>
export type ReadinessHandler = () => Promise<{ details: Record<string, unknown> }>

export type FreeConnectionsCalculators = Record<string, FreeConnectionsCalculator>
export type FreeConnectionsCalculator = {
  mean: () => number
}
