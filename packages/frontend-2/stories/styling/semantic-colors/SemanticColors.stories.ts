import SemanticColorsComponent from '~~/stories/styling/semantic-colors/SemanticColors.vue'
import SemanticColorsDocs from '~~/stories/styling/semantic-colors/SemanticColors.mdx'
import { Story, Meta } from '@storybook/vue3'

export default {
  title: 'Overview/Styling/Semantic Colors',
  component: SemanticColorsComponent,
  parameters: {
    docs: {
      page: SemanticColorsDocs
    }
  }
} as Meta

export const SemanticColors: Story = {
  render: () => ({
    components: { SemanticColorsComponent },
    template: `<semantic-colors-component/>`
  }),
  parameters: {
    viewMode: 'docs'
  }
}
SemanticColors.parameters = {
  viewMode: 'docs'
}
