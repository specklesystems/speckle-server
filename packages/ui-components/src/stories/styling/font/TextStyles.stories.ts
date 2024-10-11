import TextStylesComponent from './TextStyles.vue'
import type { StoryObj, Meta } from '@storybook/vue3'

export default {
  title: 'Overview/Styling/Text Styles',
  component: TextStylesComponent
} as Meta

export const TextStyles: StoryObj = {
  render: () => ({
    components: { TextStylesComponent },
    template: `<text-styles-component/>`
  }),
  parameters: {
    viewMode: 'docs'
  },
  tags: ['!autodocs']
}
