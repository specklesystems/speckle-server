import { Meta, Story } from '@storybook/vue3'
import DesignSystem from '~~/components/DesignSystem.vue'
import Viewer from '~~/components/tour/Viewer.vue'

export default {
  title: 'Auth/ Onboarding',
  component: Viewer,
  parameters: {
    layout: 'fullscreen'
  }
} as Meta

export const Default: Story = {
  render: () => ({
    components: { Viewer },
    template: `
    <Suspense>
      <Viewer />
    </Suspense>
    `
  })
}
