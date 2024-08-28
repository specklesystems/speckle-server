export type PromoBanner = {
  primaryText: string
  secondaryText?: string
  url: string
  priority: number
  expiryDate: string // ISO date string, e.g. "YYYY-MM-DD"
  image: string
  isBackgroundImage?: boolean
}
