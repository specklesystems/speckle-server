import { userEvent, within } from '@storybook/testing-library'
import { Meta, Story } from '@storybook/vue3'
import { wait } from '@speckle/shared'
import TextLink from '~~/components/text/Link.vue'
import { mergeStories, VuePlayFunction } from '~~/lib/common/helpers/storybook'

export default {
  component: TextLink,
  parameters: {
    docs: {
      description: {
        component:
          'A text link. The difference between this and a Link Button is that the button still has the padding around it and is sized more like a button.'
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
  (rightClick) =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('link')

    userEvent.click(button, rightClick ? { button: 2 } : undefined)

    await wait(1000)

    userEvent.tab()
  }
const rightClickPlay = clickPlayBuilder(true)
const leftClickPlay = clickPlayBuilder(false)

export const Default: Story = {
  render: (args) => ({
    components: { TextLink },
    setup() {
      return { args }
    },
    template: `<TextLink v-bind="args" @click="args.click">{{ args.default || 'Link' }}</TextLink>`
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
        code: '<TextLink to="/">Hello World!</TextLink>'
      }
    }
  }
}

export const Small: Story = mergeStories(Default, {
  args: {
    size: 'sm'
  }
})

export const ExtraSmall: Story = mergeStories(Default, {
  args: {
    size: 'xs'
  }
})

export const Large: Story = mergeStories(Default, {
  args: {
    size: 'lg'
  }
})

export const ExtraLarge: Story = mergeStories(Default, {
  args: {
    size: 'xl'
  }
})

export const Disabled: Story = mergeStories(Default, {
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

export const NoTarget: Story = mergeStories(Default, {
  play: leftClickPlay,
  args: {
    to: null,
    default: 'No URL, only for tracking click events'
  }
})

export const External: Story = mergeStories(Default, {
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
