import { userEvent, within } from '@storybook/testing-library'
import FormButton from '~~/components/form/Button.vue'
import { Story, Meta } from '@storybook/vue3'
import { wait } from '@speckle/shared'
import { VuePlayFunction, mergeStories } from '~~/lib/common/helpers/storybook'

export default {
  component: FormButton,
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
    size: {
      options: ['xs', 'sm', 'base', 'lg', 'xl'],
      control: { type: 'select' }
    },
    fullWidth: {
      type: 'boolean'
    },
    type: {
      options: ['standard', 'pill', 'outline', 'link'],
      control: { type: 'select' }
    },
    external: {
      type: 'boolean'
    },
    disabled: {
      type: 'boolean'
    },
    submit: {
      type: 'boolean'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A standard button to be used anywhere you need any kind of button'
      }
    }
  }
} as Meta

const clickPlayBuilder: (rightClick: boolean) => VuePlayFunction =
  (rightClick) =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    userEvent.click(button, rightClick ? { button: 2 } : undefined)

    await wait(1000)

    userEvent.tab()
  }
const rightClickPlay = clickPlayBuilder(true)
const leftClickPlay = clickPlayBuilder(false)

export const Default: Story = {
  render: (args) => ({
    components: { FormButton },
    setup() {
      return { args }
    },
    template: `<form-button v-bind="args" @click="args.click">{{ args.default || 'Submit' }}</form-button>`
  }),
  play: rightClickPlay,
  args: {
    target: '_blank',
    to: 'https://google.com',
    default: 'Button text',
    size: 'base',
    type: 'standard'
  },
  parameters: {
    docs: {
      source: {
        code: '<FormButton to="/">Hello World!</FormButton>'
      }
    }
  }
}

export const Pill: Story = mergeStories(Default, {
  args: {
    type: 'pill'
  }
})

export const Outline: Story = mergeStories(Default, {
  args: {
    type: 'outline'
  }
})

export const Link: Story = mergeStories(Default, {
  args: {
    type: 'link'
  },
  parameters: {
    docs: {
      description: {
        story: 'Basically just a link (CommonTextLink is an alias for this)'
      }
    }
  }
})

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

export const FullWidth: Story = mergeStories(Default, {
  args: {
    fullWidth: true,
    default: 'Full width button'
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

export const Submit: Story = mergeStories(Default, {
  play: leftClickPlay,
  args: {
    to: null,
    submit: true,
    default: 'Submit button'
  },
  parameters: {
    docs: {
      description: {
        story: 'Rendered as button w/ type=submit, which will submit any parent forms'
      }
    }
  }
})
