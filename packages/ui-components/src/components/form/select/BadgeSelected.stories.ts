import { Meta, StoryObj } from '@storybook/vue3'
import BadgeSelected from './BadgeSelected.vue'

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
  component: BadgeSelected,
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { BadgeSelected },
    setup: () => {
      return { args }
    },
    template: `
    <div class="flex justify-center h-72 w-full">
      <BadgeSelected v-bind="args" @update:modelValue="onModelUpdate" class="w-full"/>
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
    name: 'BadgeSelected',
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
