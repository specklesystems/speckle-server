import { LibsodiumEncryptionError } from '@/modules/shared/errors/encryption'
import { ensureError } from '@speckle/shared'
import sodium from 'libsodium-wrappers'

export type KeyPair = {
  publicKey: string
  privateKey: string
}

/**
 * Build libsodium encryptor from public key
 */
export const buildEncryptor = async (publicKey: string) => {
  if (!publicKey)
    throw new LibsodiumEncryptionError(
      'Public key must be provided to enable encryption.'
    )

  await sodium.ready
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

export const buildDecryptor = async (keyPair: KeyPair) => {
  await sodium.ready
  const binPublicKey = sodium.from_base64(
    keyPair.publicKey,
    sodium.base64_variants.ORIGINAL
  )
  const binPrivateKey = sodium.from_base64(
    keyPair.privateKey,
    sodium.base64_variants.ORIGINAL
  )

  const decrypt = async (data: string): Promise<string> => {
    if (!data?.length) {
      throw new LibsodiumEncryptionError('Empty data provided for decryption')
    }

    await sodium.ready

    try {
      // Convert the Base64 string to a Uint8Array
      const encBytes = sodium.from_base64(data, sodium.base64_variants.ORIGINAL)

      // Decrypt the secret using libsodium
      const decrypted = sodium.crypto_box_seal_open(
        encBytes,
        binPublicKey,
        binPrivateKey
      )
      sodium.memzero(binPrivateKey)
      return sodium.to_string(decrypted)
    } catch (err) {
      sodium.memzero(binPrivateKey)
      if (err instanceof Error) {
        if (err.message === 'incorrect key pair for the given ciphertext') {
          throw new LibsodiumEncryptionError('Invalid Key pair for decryption.', {
            cause: err
          })
        }

        if (err.message === 'incomplete input') {
          throw new LibsodiumEncryptionError('Invalid encryption input', {
            cause: err
          })
        }
      }

      throw new LibsodiumEncryptionError(
        'Encountered a problem while decrypting data.',
        { cause: ensureError(err) }
      )
    }
  }

  return {
    decrypt,
    dispose: () => {
      sodium.memzero(binPublicKey)
      sodium.memzero(binPrivateKey)
    }
  }
}
