import type { Meta, StoryObj } from '@storybook/vue3'
import Badges from './Badges.vue'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: unknown) => void
  }
>

type SingleItem = {
  id: string
  text: string
}

export default {
  component: Badges,
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { Badges },
    setup: () => {
      return { args }
    },
    template: `
    <div class="flex justify-center h-72 w-full">
      <Badges v-bind="args" @update:modelValue="onModelUpdate" class="w-full"/>
    </div>
    `,
    methods: {
      onModelUpdate(val: Array<SingleItem>) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    multiple: true,
    name: 'Badges',
    label: 'Choose an item',
    items: Array.from({ length: 10 }, (_, i) => ({
      id: `value${i + 1}`,
      text: `Example ${i + 1}`
    })),
    modelValue: []
  }
}

export const Single: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    multiple: false,
    modelValue: undefined
  }
}
