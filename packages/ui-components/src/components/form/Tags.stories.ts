import { Meta, StoryObj } from '@storybook/vue3'
import FormSelectTags from '~~/src/components/form/Tags.vue'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: unknown) => void
  }
>

export default {
  component: FormSelectTags
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormSelectTags },
    setup: () => {
      return { args }
    },
    template: `
    <div class="bg-foundation p-5">
      <FormSelectTags v-bind="args" @update:modelValue="onModelUpdate" class="max-w-[400px] w-full"/>
    </div>
    `,
    methods: {
      onModelUpdate(val: unknown) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    showLabel: true,
    name: 'default',
    help: 'Some help text',
    label: 'Tags',
    showRequired: true,
    color: 'page',
    placeholder: 'Choose some tags'
  }
}
