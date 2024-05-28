import { ConversionResult } from '~/lib/conversions/conversionResult'

export interface ReceiveConversionResult extends ConversionResult {
  targetAppId: string
}
