import { userEvent, within } from '@storybook/testing-library'
import FormTextInput from '~~/components/form/TextInput.vue'
import { Story, Meta } from '@storybook/vue3'
import { VuePlayFunction, mergeStories } from '~~/lib/common/helpers/storybook'
import { wait } from '@speckle/shared'

export default {
  title: 'Speckle/Form/TextInput',
  component: FormTextInput,
  parameters: {
    docs: {
      description: {
        component: 'A standard button to be used anywhere you need any kind of button'
      }
    }
  },
  argTypes: {
    type: {
      options: ['text', 'email', 'password', 'url', 'search'],
      control: { type: 'select' }
    },
    rules: {
      type: 'function'
    }
  }
} as Meta

const generateRandomName = (prefix: string) => `${prefix}-${Math.random() * 100000}`

const buildTextWriterPlayFunction =
  (text: string): VuePlayFunction =>
  async (params) => {
    const { canvasElement, viewMode } = params
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')

    // https://github.com/storybookjs/storybook/pull/19659
    await userEvent.type(input, text, { delay: viewMode === 'story' ? 100 : 0 })

    userEvent.tab()
  }

export const Default: Story = {
  render: (args) => ({
    components: { FormTextInput },
    setup() {
      return { args }
    },
    template: `<form-text-input v-bind="args"/>`
  }),
  play: buildTextWriterPlayFunction('Hello world!'),
  args: {
    type: 'text',
    name: generateRandomName('default'),
    help: 'Some help text',
    placeholder: 'Placeholder text!',
    label: 'Text input w/ Label:',
    showRequired: false,
    disabled: false,
    validateOnMount: false
  },
  parameters: {
    docs: {
      source: {
        code: '<FormTextInput name="unique-id" />'
      }
    }
  }
}

export const Email: Story = mergeStories(Default, {
  play: buildTextWriterPlayFunction('admin@example.com'),
  args: {
    type: 'email',
    name: generateRandomName('email'),
    label: 'E-mail'
  }
})

export const Password = mergeStories(Default, {
  play: buildTextWriterPlayFunction('qwerty'),
  args: {
    type: 'password',
    name: generateRandomName('password'),
    label: 'Password'
  }
})

export const Required = mergeStories(Default, {
  play: async (params) => {
    const { canvasElement } = params
    await buildTextWriterPlayFunction('some text')(params)

    await wait(1000)

    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')

    userEvent.clear(input)

    await wait(1000)

    userEvent.tab()
  },
  args: {
    name: generateRandomName('required'),
    label: 'This one is required!',
    showRequired: true,
    rules: [(val: string) => (val ? true : 'This field is required')],
    validateOnMount: true
  }
})

export const Disabled = mergeStories(Default, {
  play: buildTextWriterPlayFunction('12345'),
  args: {
    name: generateRandomName('disabled'),
    label: 'Disabled input',
    disabled: true
  }
})
