export const AppState = {
  STARTING: 'starting',
  RUNNING: 'running',
  SHUTTINGDOWN: 'shuttingdown'
} as const
export type AppState = (typeof AppState)[keyof typeof AppState]
