import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'

/**
 * Encode cursor to turn it into an opaque & obfuscated value
 */
export function encodeCursor(value: string): string {
  return base64Encode(value)
}

/**
 * Decode obfuscated cursor value
 */
export function decodeCursor(value: string): string {
  return base64Decode(value)
}
