import { BaseError } from '@/modules/shared/errors/base'

export class LibsodiumEncryptionError extends BaseError {
  static defaultMessage = 'Error encrypting/decrypting data'
  static code = 'LIBSODIUM_ENCRYPTION_ERROR'
  static statusCode = 500
}
