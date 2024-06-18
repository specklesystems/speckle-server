import { type Optional } from '@speckle/shared'

type EncryptionUtilsModule = typeof import('~/lib/common/utils/tweetnacl')
type EncryptionUtilsModulePromise = Promise<EncryptionUtilsModule>

let encryptionUtils: Optional<EncryptionUtilsModule> = undefined
let encryptionUtilsPromise: Optional<EncryptionUtilsModulePromise> = undefined

/**
 * Lazy load the heavy encryption utilities. You must invoke ensure() to initialize loading.
 */
export const useEncryptionUtils = () => {
  const logger = useLogger()

  const utils = shallowRef<Optional<EncryptionUtilsModule>>(undefined)
  const ready = computed(() => !!utils.value)

  const ensure = async () => {
    if (!encryptionUtils) {
      try {
        encryptionUtilsPromise =
          encryptionUtilsPromise || import('~/lib/common/utils/tweetnacl')
        encryptionUtils = await encryptionUtilsPromise
        utils.value = encryptionUtils
      } catch (e) {
        logger.error(e, 'Could not load encryption utils')
        throw e
      }
    } else {
      utils.value = encryptionUtils
    }

    return utils.value
  }

  return {
    isReady: ready,
    encryption: utils,
    ensure
  }
}
