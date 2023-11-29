import { action } from '@storybook/addon-actions'
import type { Meta, StoryObj } from '@storybook/vue3'
import CommonStepsNumber from '~~/src/components/common/steps/Number.vue'
import type { NumberStepType } from '~~/src/helpers/common/components'
import { TailwindBreakpoints } from '~~/src/helpers/tailwind'
import { mergeStories } from '~~/src/stories/helpers/storybook'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: boolean) => void
  }
>

const testStepsWithDescription: NumberStepType[] = [
  {
    name: 'First step',
    onClick: action('step-clicked'),
    description: 'Some example text'
  },
  {
    name: 'Second step',
    onClick: action('step-clicked'),
    description: 'More example text'
  },
  {
    name: 'Third step',
    onClick: action('step-clicked'),
    description: 'Final example text'
  }
]

const testStepsWithoutDescription: NumberStepType[] = [
  {
    name: 'First step',
    onClick: action('step-clicked')
  },
  {
    name: 'Second step',
    onClick: action('step-clicked')
  },
  {
    name: 'Third step',
    onClick: action('step-clicked')
  }
]

export default {
  component: CommonStepsNumber,
  argTypes: {
    orientation: {
      options: ['horizontal', 'vertical'],
      control: { type: 'select' }
    },
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    },
    stepsPadding: {
      options: ['base', 'xs', 'sm'],
      control: { type: 'select' }
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Number-based steps component. Also supports optional description.'
      }
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { CommonStepsNumber },
    setup: () => ({ args }),
    template: `<CommonStepsNumber v-bind="args" @update:modelValue="onModelUpdate"/>`,
    methods: {
      onModelUpdate(val: boolean) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    ariaLabel: 'Steps ARIA title!',
    orientation: 'horizontal',
    steps: testStepsWithDescription,
    modelValue: 1,
    stepsPadding: 'base'
  }
}

export const Vertical: StoryType = mergeStories(Default, {
  args: {
    orientation: 'vertical'
  }
})

export const StartOnNegativeStep: StoryType = mergeStories(Default, {
  args: {
    modelValue: -1
  },
  parameters: {
    docs: {
      description: {
        story: 'Start on -1 step (on neither of the steps)'
      }
    }
  }
})

export const NoDescription: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    steps: testStepsWithoutDescription
  }
}

export const GoVerticalBelowBreakpoint: StoryType = mergeStories(Default, {
  args: {
    goVerticalBelow: TailwindBreakpoints.md
  }
})
