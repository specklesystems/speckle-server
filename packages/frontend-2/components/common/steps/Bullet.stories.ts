import { action } from '@storybook/addon-actions'
import { Meta, Story } from '@storybook/vue3'
import CommonStepsBullet from '~~/components/common/steps/Bullet.vue'
import { StepType } from '~~/lib/common/helpers/components'
import { mergeStories } from '~~/lib/common/helpers/storybook'

const testSteps: StepType[] = [
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
  component: CommonStepsBullet,
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
        component: 'Bullet-based steps component'
      }
    }
  }
} as Meta

export const Default: Story = {
  render: (args, ctx) => ({
    components: { CommonStepsBullet },
    setup: () => ({ args }),
    template: `<CommonStepsBullet v-bind="args" @update:modelValue="onModelUpdate"/>`,
    methods: {
      onModelUpdate(val: boolean) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    ariaLabel: 'Steps ARIA title!',
    basic: false,
    orientation: 'horizontal',
    steps: testSteps,
    modelValue: 1
  }
}

export const Vertical: Story = mergeStories(Default, {
  args: {
    orientation: 'vertical'
  }
})

export const VersionBasic: Story = mergeStories(Default, {
  args: {
    basic: true
  }
})

export const StartOnNullStep: Story = mergeStories(Default, {
  args: {
    modelValue: -1
  },
  parameters: {
    docs: {
      description: {
        story: 'Start on NULL step (on neither of the steps)'
      }
    }
  }
})
