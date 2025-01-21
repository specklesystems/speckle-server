import type { Meta, StoryObj } from '@storybook/vue3'
import FormCodeInput from '~~/src/components/form/CodeInput.vue'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: string) => void
    complete: (val: string) => void
  }
>

export default {
  component: FormCodeInput,
  parameters: {
    docs: {
      description: {
        component:
          'A verification code input component that handles digit-by-digit entry with auto-advance and paste support.'
      }
    }
  },
  argTypes: {
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    },
    complete: {
      type: 'function',
      action: 'complete'
    },
    digitCount: {
      control: { type: 'number' }
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormCodeInput },
    setup: () => ({ args }),
    template: `
      <div class="flex justify-center p-4">
        <FormCodeInput 
          v-bind="args" 
          @update:modelValue="onModelUpdate"
          @complete="args.complete"
        />
      </div>
    `,
    methods: {
      onModelUpdate(val: string) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    modelValue: '',
    digitCount: 6,
    disabled: false,
    errorMessage: '',
    error: false,
    complete: (val: string) => console.log('Complete:', val)
  }
}

export const Disabled: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true,
    modelValue: '123456'
  }
}

export const DifferentLength: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    digitCount: 4
  }
}

export const WithError: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    error: true,
    modelValue: '123456'
  }
}
