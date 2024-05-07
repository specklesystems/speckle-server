import sodium from 'libsodium-wrappers'

/**
 * DO NOT IMPORT THIS DIRECTLY/SYNCHRONOUSLY ON THE CLIENT SIDE, THESE DEPS ARE QUITE HEAVY
 * USE THE useEncryptionUtils COMPOSABLE INSTEAD
 */

/**
 * Build libsodium encryptor from public key
 */
export const buildEncryptor = async (publicKey: string) => {
  if (!publicKey) throw new Error('Public key must be provided to enable encryption.')

  await sodium.ready
  // eslint-disable-next-line prefer-const
  const binaryKey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)

  const encrypt = async (data: string): Promise<string> => {
    await sodium.ready
    const binaryData = sodium.from_string(data)

    // Encrypt the secret using libsodium
    const encBytes = sodium.crypto_box_seal(binaryData, binaryKey)

    // Convert the encrypted Uint8Array to Base64
    const output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
    return output
  }

  return {
    encrypt,
    dispose: () => {
      sodium.memzero(binaryKey)
    }
  }
}
