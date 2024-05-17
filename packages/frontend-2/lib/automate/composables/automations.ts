import type { Nullable, Optional } from '@speckle/shared'
import { useApolloClient } from '@vue/apollo-composable'
import { AutomationPublicKeysRetrievalError } from '~/lib/automate/errors/automations'
import { projectAutomationCreationPublicKeysQuery } from '~/lib/automate/graphql/queries'
import { useEncryptionUtils } from '~/lib/common/composables/crypto'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'

export const useAutomationPublicKey = () => {
  const apollo = useApolloClient().client

  return async (params: { automationId: string; projectId: string }) => {
    const { projectId, automationId } = params

    const res = await apollo.query({
      query: projectAutomationCreationPublicKeysQuery,
      variables: {
        projectId,
        automationId
      }
    })

    const keys = res.data?.project?.automation?.creationPublicKeys
    if (keys.length) return keys[0]

    const error = getFirstErrorMessage(
      res.errors,
      "Couldn't retrieve any automation encryption keys"
    )
    throw new AutomationPublicKeysRetrievalError(error)
  }
}

/**
 * Make sure you dispose the encryptor after you're done with it to avoid memory leaks
 */
export const useAutomationInputEncryptor = (
  options?: Partial<{
    /**
     * Invoke encryption util loading when this ref switches to true
     */
    ensureWhen: Ref<boolean> | Ref<Optional<boolean>>
  }>
) => {
  const { ensureWhen } = options || {}
  const getPublicKey = useAutomationPublicKey()
  const encryption = useEncryptionUtils()

  const ensureUtils = () => encryption.ensure()
  const forAutomation = async (params: { automationId: string; projectId: string }) => {
    const utils = await ensureUtils()
    const key = await getPublicKey(params)
    const encryptor = utils.buildEncryptor(key)

    return {
      encryptInputs: (params: { inputs: Nullable<Record<string, unknown>> }) =>
        encryptor.encrypt(JSON.stringify(params.inputs)),
      dispose: () => encryptor.dispose()
    }
  }

  if (ensureWhen) {
    watch(
      ensureWhen,
      (newVal, oldVal) => {
        if (!!newVal === !!oldVal) return
        if (!newVal) return

        ensureUtils()
      },
      { immediate: true }
    )
  }

  return { ensureUtils, forAutomation }
}

export type AutomationInputEncryptor = Awaited<
  ReturnType<ReturnType<typeof useAutomationInputEncryptor>['forAutomation']>
>
