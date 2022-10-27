import DemoNuxtFunctionality from '~~/components/DemoNuxtFunctionality.vue'
import { Story, Meta } from '@storybook/vue3'

export default {
  title: 'Speckle/Demo Nuxt Functionality (test)',
  component: DemoNuxtFunctionality
} as Meta

export const Default: Story = {
  render: () => ({
    components: { DemoNuxtFunctionality },
    template: `<demo-nuxt-functionality/>`
  })
}
