export type PromoBanner = {
  id: string
  primaryText: string
  secondaryText?: string
  url: string
  priority: number
  expiryDate: string // ISO date string, e.g. "YYYY-MM-DD"
}
