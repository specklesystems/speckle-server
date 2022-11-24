import { Meta, Story } from '@storybook/vue3'
import AuthOnboardingPanel from '~~/components/auth/OnboardingPanel.vue'

export default {
  component: AuthOnboardingPanel
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { AuthOnboardingPanel },
    setup: () => ({ args }),
    template: `<AuthOnboardingPanel v-bind="args" />`
  })
}
