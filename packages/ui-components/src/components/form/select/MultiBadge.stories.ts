import { Meta, StoryObj } from '@storybook/vue3'
import MultiBadge from './MultiBadge.vue'

// Vue components don't support generic props, so having to rely on any
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
type SingleItem = any

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: unknown) => void
  }
>

export default {
  component: MultiBadge,
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args) => ({
    components: { MultiBadge },
    setup: () => {
      return { args }
    },
    template: `
    <div class="flex justify-center h-72 w-full">
      <MultiBadge v-bind="args" @update:modelValue="onModelUpdate" class="w-full"/>
    </div>
    `,
    methods: {
      onModelUpdate(val: Array<SingleItem>) {
        args['update:modelValue'](val)
      }
    }
  }),
  args: {
    multiple: true,
    name: 'MultiBadge',
    label: 'Choose an item',
    items: Array.from({ length: 10 }, (_, i) => ({
      id: `value${i + 1}`,
      text: `Example ${i + 1}`
    }))
  }
}
