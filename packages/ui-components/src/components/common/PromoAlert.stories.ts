// AGENT WRITE HERE:
import type { Meta, StoryObj } from '@storybook/vue3'
import PromoAlert from '~~/src/components/common/PromoAlert.vue'

const meta: Meta<typeof PromoAlert> = {
  component: PromoAlert,
  args: {
    title: 'Upgrade your workspace',
    text: 'Unlock advanced features and collaboration tools by upgrading your plan.',
    button: { title: 'Learn more', to: 'https://speckle.systems' }
  },
  argTypes: {
    title: { control: 'text' },
    text: { control: 'text' },
    button: { control: 'object' },
    showCloser: { control: 'boolean' }
  }
}
export default meta

interface PromoAlertArgs {
  title?: string
  text?: string
  button?: { to?: string; title: string }
  showCloser?: boolean
}

const render = (args: PromoAlertArgs) => ({
  components: { PromoAlert },
  setup() {
    return { args }
  },
  template: `
    <div class="max-w-sm h-full">
      <PromoAlert v-bind="args" @click="args.click" @close="args.close" />
    </div>
  `
})

type Story = StoryObj<typeof PromoAlert>

export const Default: Story = { render }

export const WithoutLink: Story = { render, args: { button: { title: 'Learn more' } } }

export const WithoutButton: Story = { render, args: { button: undefined } }

export const TitleOnly: Story = { render, args: { text: undefined, button: undefined } }

export const ButtonOnly: Story = {
  render,
  args: { title: undefined, text: undefined, button: { title: 'Upgrade' } }
}

export const CustomClick: Story = {
  render,
  args: { button: { title: 'Trigger action' } }
}

export const WithCloser: Story = { render, args: { showCloser: true } }
