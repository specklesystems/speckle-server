import { Meta, StoryObj } from '@storybook/vue3'
import DesignSystem from '~~/components/DesignSystem.vue'

export default {
  title: 'Overview/Styling/Design System Examples',
  component: DesignSystem
} as Meta

export const Default: StoryObj = {
  render: () => ({
    components: { DesignSystem },
    template: `
      <div class="p-8 bg-foundation-page">
        <DesignSystem/>
      </div>
    `
  })
}
