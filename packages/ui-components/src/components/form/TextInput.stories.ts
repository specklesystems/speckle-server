import FormTextInput from '~~/src/components/form/TextInput.vue'
import FormButton from '~~/src/components/form/Button.vue'
import type { StoryObj, Meta } from '@storybook/vue3'
import { mergeStories } from '~~/src/stories/helpers/storybook'
import { nanoid } from 'nanoid'

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
      options: ['page', 'foundation', 'transparent'],
      control: { type: 'select' }
    },
    rules: {
      type: 'function'
    },
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    },
    change: {
      type: 'function',
      action: 'change'
    },
    input: {
      type: 'function',
      action: 'input'
    },
    clear: {
      type: 'function',
      action: 'clear'
    },
    focus: {
      type: 'function',
      action: 'focus'
    },
    blur: {
      type: 'function',
      action: 'blur'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'lg', 'base', 'xl']
    },
    labelPosition: {
      control: { type: 'select' },
      options: ['top', 'left']
    }
  }
} as Meta

const generateRandomName = (prefix: string) => `${prefix}-${nanoid()}`

export const Default: StoryObj = {
  render: (args) => ({
    components: { FormTextInput },
    setup() {
      return { args }
    },
    template: `<div class="bg-foundation p-5">
    <form-text-input v-bind="args"
      @update:modelValue="args['update:modelValue']"
      @change="args['change']"
      @input="args['input']"
      @clear="args['clear']"
      @focus="args['focus']"
    />
    </div>`
  }),
  args: {
    modelValue: 'Hello world',
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
    color: 'page',
    labelPosition: 'top'
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
  args: {
    type: 'email',
    name: generateRandomName('email'),
    label: 'E-mail'
  }
})

export const Password = mergeStories(Default, {
  args: {
    type: 'password',
    name: generateRandomName('password'),
    label: 'Password'
  }
})

export const Required = mergeStories(Default, {
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
  args: {
    name: generateRandomName('disabled'),
    label: 'Disabled input',
    disabled: true
  }
})

export const WithClear = mergeStories(Default, {
  args: {
    name: generateRandomName('withclear'),
    label: 'Click on cross to clear',
    showClear: true
  }
})

export const LabelLeft = mergeStories(Default, {
  args: {
    name: generateRandomName('labelleft'),
    label: 'With label left',
    labelPosition: 'left'
  }
})

export const Loading = mergeStories(Default, {
  args: {
    name: generateRandomName('loading'),
    label: 'With loading spinner',
    loading: true
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
