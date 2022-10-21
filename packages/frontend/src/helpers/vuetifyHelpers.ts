import type { CombinedVueInstance } from 'vue/types/vue'

/**
 * Use this to type v-form $refs instances
 */
export type VFormInstance = CombinedVueInstance<
  Vue,
  unknown,
  {
    /**
     * Reset validation state
     */
    resetValidation(): void
    /**
     * Validate the form and return whether it's valid or not
     */
    validate(): boolean
  },
  unknown,
  unknown,
  unknown
>
