import Button from '~~/components/form/Button.vue'
import { Story, Meta } from '@storybook/vue3'

export default {
  title: 'Speckle/Form/Button',
  component: Button,
  parameters: {
    docs: {
      component: 'A standard button to be used anywhere you need any kind of button'
    }
  }
} as Meta

export const Default: Story = {
  render: () => ({
    components: { FormButton: Button },
    template: `<form-button/>`
  })
}
