import { action } from '@storybook/addon-actions'
import { Meta, Story } from '@storybook/vue3'
import CommonStepsNumber from '~~/components/common/steps/Number.vue'
import { NumberStepType } from '~~/lib/common/helpers/components'
import { mergeStories } from '~~/lib/common/helpers/storybook'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

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

export const Default: Story = {
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
    modelValue: 1
  }
}

export const Vertical: Story = mergeStories(Default, {
  args: {
    orientation: 'vertical'
  }
})

export const StartOnNegativeStep: Story = mergeStories(Default, {
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

export const NoDescription: Story = {
  ...Default,
  args: {
    ...Default.args,
    steps: testStepsWithoutDescription
  }
}

export const GoVerticalBelowBreakpoint: Story = mergeStories(Default, {
  args: {
    goVerticalBelow: TailwindBreakpoints.md
  }
})
