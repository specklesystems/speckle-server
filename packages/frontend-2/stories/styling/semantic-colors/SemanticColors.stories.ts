import SemanticColorsComponent from '~~/stories/styling/semantic-colors/SemanticColors.vue'
import SemanticColorsDocs from '~~/stories/styling/semantic-colors/SemanticColors.mdx'
import { Story, Meta } from '@storybook/vue3'

export default {
  title: 'Speckle/Styling/Semantic Colors',
  component: SemanticColorsComponent,
  parameters: {
    docs: {
      page: SemanticColorsDocs
    }
  }
} as Meta

const Template: Story = () => ({
  components: { SemanticColorsComponent },
  template: `<semantic-colors-component/>`
})

export const SemanticColors = Template.bind({})
SemanticColors.parameters = {
  viewMode: 'docs'
}
