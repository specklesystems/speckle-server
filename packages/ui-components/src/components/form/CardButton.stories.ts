import { userEvent, within } from '@storybook/test'
import type { Meta, StoryObj } from '@storybook/vue3'
import { wait } from '@speckle/shared'
import FormCardButton from '~~/src/components/form/CardButton.vue'
import type { VuePlayFunction } from '~~/src/stories/helpers/storybook'
import { rightClick } from '~~/src/helpers/testing'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: boolean) => void
  }
>

export default {
  component: FormCardButton,
  argTypes: {
    default: {
      type: 'string',
      description: 'Default slot holds button contents'
    },
    click: {
      action: 'click',
      type: 'function'
    },
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A card button that supports a toggled/selected state'
      }
    }
  }
} as Meta

const clickPlayBuilder: (rightClick?: boolean) => VuePlayFunction =
  (useRightClick) =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    if (useRightClick) {
      await rightClick(canvas.getByRole('button'))
    } else {
      await userEvent.click(canvas.getByRole('button'))
    }

    await wait(500)

    if (useRightClick) {
      await rightClick(canvas.getByRole('button'))
    } else {
      await userEvent.click(canvas.getByRole('button'))
    }

    await userEvent.tab()
  }

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormCardButton },
    setup() {
      return { args }
    },
    template: `<FormCardButton v-bind="args" @click="args.click" @update:modelValue="onModelUpdate">{{ args.default || 'Text' }}</FormCardButton>`,
    methods: {
      onModelUpdate(val: boolean) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  play: clickPlayBuilder(),
  args: {
    default: 'Architecture',
    disabled: false,
    modelValue: false
  }
}

export const Disabled: StoryType = {
  ...Default,
  args: {
    disabled: true
  }
}

export const Selected: StoryType = {
  ...Default,
  play: clickPlayBuilder(true),
  args: {
    modelValue: true
  }
}
