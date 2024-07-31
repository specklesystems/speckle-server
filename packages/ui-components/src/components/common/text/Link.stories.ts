import { userEvent, within } from '@storybook/test'
import type { Meta, StoryObj } from '@storybook/vue3'
import { wait } from '@speckle/shared'
import CommonTextLink from '~~/src/components/common/text/Link.vue'
import { mergeStories } from '~~/src/stories/helpers/storybook'
import type { VuePlayFunction } from '~~/src/stories/helpers/storybook'
import { rightClick } from '~~/src/helpers/testing'

export default {
  component: CommonTextLink,
  parameters: {
    docs: {
      description: {
        component: 'Basically just a wrapper over FormButton w/ type link'
      }
    }
  },
  argTypes: {
    to: {
      type: 'string'
    },
    default: {
      type: 'string',
      description: 'Default slot holds button contents'
    },
    click: {
      action: 'click',
      type: 'function'
    },
    external: {
      type: 'boolean'
    },
    disabled: {
      type: 'boolean'
    },
    size: {
      options: ['xs', 'sm', 'base', 'lg', 'xl'],
      control: { type: 'select' }
    }
  }
} as Meta

const clickPlayBuilder: (rightClick: boolean) => VuePlayFunction =
  (useRightClick) =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('link')

    if (useRightClick) {
      await rightClick(button)
    } else {
      await userEvent.click(button)
    }

    await wait(1000)

    await userEvent.tab()
  }
const rightClickPlay = clickPlayBuilder(true)
const leftClickPlay = clickPlayBuilder(false)

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonTextLink },
    setup() {
      return { args }
    },
    template: `<CommonTextLink v-bind="args" @click="args.click">{{ args.default || 'Link' }}</CommonTextLink>`
  }),
  play: rightClickPlay,
  args: {
    to: 'https://google.com',
    disabled: false,
    default: 'Click me!',
    size: 'base'
  },
  parameters: {
    docs: {
      source: {
        code: '<CommonTextLink to="/">Hello World!</CommonTextLink>'
      }
    }
  }
}

export const Small: StoryObj = mergeStories(Default, {
  args: {
    size: 'small'
  }
})

export const Large: StoryObj = mergeStories(Default, {
  args: {
    size: 'large'
  }
})

export const Disabled: StoryObj = mergeStories(Default, {
  play: leftClickPlay,
  args: {
    disabled: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Button is disabled and no mouse events fire'
      }
    }
  }
})

export const NoTarget: StoryObj = mergeStories(Default, {
  play: leftClickPlay,
  args: {
    to: null,
    default: 'No URL, only for tracking click events'
  }
})

export const External: StoryObj = mergeStories(Default, {
  args: {
    external: true,
    to: '/',
    default: 'External link'
  },
  parameters: {
    docs: {
      description: {
        story: 'Forces target to be treated as an external link'
      }
    }
  }
})
