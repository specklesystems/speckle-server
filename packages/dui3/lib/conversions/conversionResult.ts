export interface ConversionResult {
  isSuccessful: boolean
  resultId?: string
  resultAppId?: string
  targetId: string
  targetType?: string
  errorMessage?: string
}
