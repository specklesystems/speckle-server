import { action } from '@storybook/addon-actions'
import type { Meta, StoryObj } from '@storybook/vue3'
import CommonStepsBullet from '~~/src/components/common/steps/Bullet.vue'
import type { BulletStepType } from '~~/src/helpers/common/components'
import { TailwindBreakpoints } from '~~/src/helpers/tailwind'
import { mergeStories } from '~~/src/stories/helpers/storybook'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: boolean) => void
  }
>

const testSteps: BulletStepType[] = [
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
    stepsPadding: {
      options: ['base', 'xs', 'sm'],
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

export const Default: StoryType = {
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
    modelValue: 1,
    nonInteractive: false,
    stepsPadding: 'base'
  }
}

export const Vertical: StoryType = mergeStories(Default, {
  args: {
    orientation: 'vertical'
  }
})

export const VersionBasic: StoryType = mergeStories(Default, {
  args: {
    basic: true
  }
})

export const BasicVertical: StoryType = mergeStories(Default, {
  args: {
    basic: true,
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

export const GoVerticalBelowBreakpoint: StoryType = mergeStories(Default, {
  args: {
    goVerticalBelow: TailwindBreakpoints.md
  }
})

export const NonInteractive: StoryType = mergeStories(Default, {
  args: {
    nonInteractive: true
  }
})
