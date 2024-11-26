export interface PreviewGenerator {
  takeScreenshot: TakeScreenshot
  load: Load
}

export type TakeScreenshot = () => Promise<PreviewResult>

export type PreviewResult = {
  duration: number
  screenshots: Record<string, string>
}

export type LoadArgs = { url: string; token: string }
export type Load = (args: LoadArgs) => Promise<void>
