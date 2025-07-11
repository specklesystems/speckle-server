import { AutomateFunction } from './types.js'

export type GetAutomateFunction = (args: {
  functionId: string
}) => Promise<AutomateFunction | null>
