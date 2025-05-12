export type EmbedThemeConfig = 'dark' | 'light' | 'auto'

export interface CalApi {
  (command: string, ...args: unknown[]): void
  loaded: boolean
  ns: Record<string, CalNamespace>
  q: unknown[]
}

export interface CalNamespace {
  (action: string, options: Record<string, unknown>): void
  q: unknown[]
}
