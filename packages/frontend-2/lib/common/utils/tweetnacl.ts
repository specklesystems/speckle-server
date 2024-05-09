import { seal } from 'tweetnacl-sealedbox-js'
import { decodeBase64, decodeUTF8, encodeBase64 } from 'tweetnacl-util'

/**
 * DO NOT IMPORT THIS DIRECTLY/SYNCHRONOUSLY ON THE CLIENT SIDE, THESE DEPS ARE QUITE HEAVY
 * USE THE useEncryptionUtils COMPOSABLE INSTEAD
 */

/**
 * Build TweetNaCl encryptor from public key
 */
export const buildEncryptor = (publicKey: string) => {
  if (!publicKey) throw new Error('Public key must be provided to enable encryption.')

  // Convert the public key from Base64 to Uint8Array
  const binaryKey = decodeBase64(publicKey)

  const encrypt = (data: string) => {
    const binaryData = decodeUTF8(data)

    // Encrypt the secret using TweetNaCl
    const encBytes = seal(binaryData, binaryKey)

    // Convert the encrypted Uint8Array to Base64
    const output = encodeBase64(encBytes)
    return output
  }

  return {
    encrypt,
    dispose: () => {
      for (let i = 0; i < binaryKey.length; i++) {
        binaryKey[i] = 0
      }
    }
  }
}
