import { ValidatePasswordStrengthDocument } from '@/graphql/generated/graphql'
import { Nullable } from '@/helpers/typeHelpers'
import { useApolloClient } from '@vue/apollo-composable'
import { ref, watch } from 'vue'

export function useValidatablePasswordEntry() {
  const password = ref<Nullable<string>>(null)
  const passwordConfirmation = ref<Nullable<string>>(null)
  /**
   * Strength value from 1 to 100. Its PasswordStrengthCheckResults.score times 25.
   */
  const passwordStrength = ref<Nullable<number>>(null)
  const passwordSuggestion = ref<Nullable<string>>(null)

  const apollo = useApolloClient()

  /**
   * Re-check password strength
   */
  const updatePasswordStrength = async () => {
    if (!password.value) {
      passwordStrength.value = 1
      passwordSuggestion.value = null
      return
    }

    const result = await apollo.client.query({
      query: ValidatePasswordStrengthDocument,
      variables: { pwd: password.value }
    })

    passwordStrength.value = result.data.userPwdStrength.score * 25
    passwordSuggestion.value =
      result.data.userPwdStrength.feedback.suggestions[0] || null
  }

  /**
   * Do basic validation
   */
  const validatePassword = () => {
    if (!password.value) {
      throw new Error('Password is empty')
    }

    if (password.value !== passwordConfirmation.value) {
      throw new Error('Passwords do not match')
    }
  }

  /**
   * Asynchronously validate that the password is strong enough
   */
  const validatePasswordStrength = async () => {
    await updatePasswordStrength()
    if ((passwordStrength.value || 0) < 50) {
      throw new Error('Password too weak')
    }
  }

  // Wipe old suggestion, if password is changed
  watch(password, () => {
    passwordStrength.value = 0
    passwordSuggestion.value = null
  })

  return {
    password,
    passwordConfirmation,
    passwordStrength,
    passwordSuggestion,
    updatePasswordStrength,
    validatePassword,
    validatePasswordStrength
  }
}
