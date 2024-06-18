import { action } from '@storybook/addon-actions'
import type { StoryContext } from '@storybook/vue3'
import { computed } from 'vue'

/**
 * Composable for use in storybook to create a v-model binding that properly reports changes to the Actions tab
 * and also updates the model in the Controls tab
 */
export const useStorybookVmodel = (params: {
  args: Record<string, unknown>
  prop: string
  ctx: StoryContext
  /**
   * Prevents the model from being updated
   */
  blockChanges?: boolean
}) => {
  const { args, prop, ctx, blockChanges } = params
  const storybookAction = action(`update:${prop}`)

  const modelValue = computed({
    get: () => params.args[prop],
    set: (newVal) => {
      if (!blockChanges) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        ctx.updateArgs({ ...args, [prop]: newVal })
      }
      storybookAction(JSON.parse(JSON.stringify(newVal))) // parse/stringify to clean up fn refs
    }
  })

  return {
    model: modelValue
  }
}
