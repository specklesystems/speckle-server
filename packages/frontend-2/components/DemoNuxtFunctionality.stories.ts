import DemoNuxtFunctionality from '~~/components/DemoNuxtFunctionality.vue'
import { StoryObj, Meta } from '@storybook/vue3'

export default {
  title: 'Appendix/Test/Demo Nuxt Functionality (test)',
  component: DemoNuxtFunctionality,
  parameters: {
    docs: {
      description: {
        component:
          'This invokes various Nuxt globals (funcs & Vue components) as a test to ensure the Nuxt-Storybook integration works'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: () => ({
    components: { DemoNuxtFunctionality },
    template: `<demo-nuxt-functionality/>`
  })
}
