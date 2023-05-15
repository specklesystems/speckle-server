import { userEvent, within } from '@storybook/testing-library'
import FormTextInput from '~~/src/components/form/TextInput.vue'
import FormButton from '~~/src/components/form/Button.vue'
import { StoryObj, Meta } from '@storybook/vue3'
import { wait } from '@speckle/shared'
import { VuePlayFunction, mergeStories } from '~~/src/stories/helpers/storybook'

export default {
  component: FormTextInput,
  parameters: {
    docs: {
      description: {
        component:
          'A text input box, integrated with vee-validate for validation. Feed in rules through the `rules` prop.'
      }
    }
  },
  argTypes: {
    type: {
      options: ['text', 'email', 'password', 'url', 'search'],
      control: { type: 'select' }
    },
    color: {
      options: ['page', 'foundation'],
      control: { type: 'select' }
    },
    rules: {
      type: 'function'
    },
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
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

export const Default: StoryObj = {
  render: (args) => ({
    components: { FormTextInput },
    setup() {
      return { args }
    },
    template: `<div class="bg-foundation p-5">
    <form-text-input v-bind="args" @update:modelValue="args['update:modelValue']"/>
    </div>`
  }),
  play: buildTextWriterPlayFunction('Hello world!'),
  args: {
    modelValue: '',
    type: 'text',
    name: generateRandomName('default'),
    help: 'Some help text',
    placeholder: 'Placeholder text!',
    label: 'Text input w/ Label:',
    showRequired: false,
    showLabel: true,
    disabled: false,
    validateOnMount: false,
    inputClasses: '',
    color: 'page'
  },
  parameters: {
    docs: {
      source: {
        code: `<FormTextInput name="unique-id" v-model="model" :rules="(val) => val ? true : 'Value is required!'"/>`
      }
    }
  }
}

export const Email: StoryObj = mergeStories(Default, {
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
    validateOnMount: true,
    validateOnValueUpdate: true
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

export const WithClear = mergeStories(Default, {
  play: buildTextWriterPlayFunction('12345'),
  args: {
    name: generateRandomName('withclear'),
    label: 'Click on cross to clear',
    showClear: true
  }
})

export const WithCustomRightSlot = mergeStories(Default, {
  render: (args) => ({
    components: { FormTextInput, FormButton },
    setup() {
      return { args }
    },
    template: `<div class="bg-foundation p-5">
      <form-text-input v-bind="args" @update:modelValue="args['update:modelValue']">
        <template #input-right>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2">
            <form-button size="xs">Click me</form-button>
          </div>
        </template>
      </form-text-input>
    </div>`
  }),
  play: buildTextWriterPlayFunction('12345'),
  args: {
    name: generateRandomName('withcustomrightslot'),
    label: 'Right side is customized with a button!',
    inputClasses: 'pr-20'
  }
})

export const WithFoundationColor = mergeStories(Default, {
  render: (args) => ({
    components: { FormTextInput },
    setup() {
      return { args }
    },
    template: `<div class="bg-foundation-page p-5">
    <form-text-input v-bind="args" @update:modelValue="args['update:modelValue']"/>
    </div>`
  }),
  args: {
    color: 'foundation',
    name: generateRandomName('withFoundationColor')
  }
})
