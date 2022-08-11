import { Express } from 'express'

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybeAsync<T> = T | Promise<T>

export type SpeckleModule = {
  init: (app: Express) => MaybeAsync<void>
  finalize: (app: Express) => MaybeAsync<void>
}
