import { PreviewPageResult } from './job.js'

export interface PreviewGenerator {
  takeScreenshot: TakeScreenshot
  load: Load
}

export type TakeScreenshot = () => Promise<PreviewPageResult>

export type LoadArgs = { url: string; token: string }
export type Load = (args: LoadArgs) => Promise<void>

export type { PreviewPageResult } from './job.js'
