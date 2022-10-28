import { screen, userEvent, fireEvent } from '@storybook/testing-library'
import Button from '~~/components/form/Button.vue'
import { Story, Meta } from '@storybook/vue3'
import { wait } from '@speckle/shared'

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
  }),
  play: async () => {
    const button = screen.getByText('Submit')

    userEvent.click(button)

    await wait(1000)

    userEvent.tab()
    fireEvent.focusOut(button)
  }
}
