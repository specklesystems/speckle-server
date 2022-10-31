import IntegrationStoryDemo from '~/components/IntegrationStoryDemo.vue'
import { Meta, Story } from '@storybook/vue3'

export default {
  component: IntegrationStoryDemo
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { IntegrationStoryDemo },
    setup() {
      return { args }
    },
    template: `<integration-story-demo/>`
  })
}
