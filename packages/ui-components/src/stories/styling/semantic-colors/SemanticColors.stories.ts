import SemanticColorsComponent from '~~/src/stories/styling/semantic-colors/SemanticColors.vue'
import { StoryObj, Meta } from '@storybook/vue3'

export default {
  title: 'Overview/Styling/Semantic Colors',
  component: SemanticColorsComponent
} as Meta

export const SemanticColors: StoryObj = {
  render: () => ({
    components: { SemanticColorsComponent },
    template: `<semantic-colors-component/>`
  }),
  parameters: {
    viewMode: 'docs'
  }
}
