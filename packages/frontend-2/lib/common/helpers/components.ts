/**
 * Represents a single CommonSteps step item
 */
export type StepType = {
  name: string
  href?: string
  onClick?: () => void
}
