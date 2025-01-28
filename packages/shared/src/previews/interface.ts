import { PreviewResult } from './job.js'

export interface PreviewGenerator {
  takeScreenshot: TakeScreenshot
  load: Load
}

export type TakeScreenshot = () => Promise<PreviewResult>

export type LoadArgs = { url: string; token: string }
export type Load = (args: LoadArgs) => Promise<void>

export type { PreviewResult } from './job.js'
