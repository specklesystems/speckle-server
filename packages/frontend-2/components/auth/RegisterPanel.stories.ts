import { Meta, Story } from '@storybook/vue3'
import AuthRegisterPanel from '~~/components/auth/RegisterPanel.vue'
import * as AuthLoginPanelStories from '~~/components/auth/LoginPanel.stories'

export default {
  component: AuthRegisterPanel,
  parameters: {
    backgrounds: {
      default: 'foundation-page'
    }
  },
  ...AuthLoginPanelStories.default
} as Meta

export const Default: Story = {
  ...AuthLoginPanelStories.Default,
  render: (args) => ({
    components: { AuthRegisterPanel },
    setup() {
      return { args }
    },
    template: `<AuthRegisterPanel v-bind="args"/>`
  })
}
