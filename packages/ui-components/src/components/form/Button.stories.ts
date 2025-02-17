import { userEvent, within } from '@storybook/test'
import FormButton from '~~/src/components/form/Button.vue'
import type { StoryObj, Meta } from '@storybook/vue3'
import { wait } from '@speckle/shared'
import { mergeStories } from '~~/src/stories/helpers/storybook'
import type { VuePlayFunction } from '~~/src/stories/helpers/storybook'
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { rightClick } from '~~/src/helpers/testing'

export default {
  component: FormButton,
  argTypes: {
    color: {
      options: ['primary', 'outline', 'subtle', 'danger'],
      control: { type: 'select' }
    },
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
      options: ['sm', 'base', 'lg'],
      control: { type: 'select' }
    },
    fullWidth: {
      type: 'boolean'
    },
    external: {
      type: 'boolean'
    },
    disabled: {
      type: 'boolean'
    },
    submit: {
      type: 'boolean'
    },
    iconLeft: {
      type: 'function'
    },
    iconRight: {
      type: 'function'
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
  (useRightClick) =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

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
    components: { FormButton },
    setup() {
      return { args }
    },
    template: `<form-button v-bind="args" @click="args.click">{{ args.default || 'Submit' }}</form-button>`
  }),
  play: rightClickPlay,
  args: {
    target: '_blank',
    default: 'Button text',
    size: 'base',
    type: 'standard',
    fullWidth: false,
    text: false,
    link: false,
    color: 'primary',
    disabled: false,
    submit: false,
    hideText: false,
    loading: false
  },
  parameters: {
    docs: {
      source: {
        code: '<FormButton to="/">Hello World!</FormButton>'
      }
    }
  }
}

export const Subtle: StoryObj = mergeStories(Default, {
  args: {
    color: 'subtle'
  }
})

export const Outlined: StoryObj = mergeStories(Default, {
  args: {
    color: 'outline'
  }
})

export const Danger: StoryObj = mergeStories(Default, {
  args: {
    color: 'danger'
  }
})

export const Small: StoryObj = mergeStories(Default, {
  args: {
    size: 'sm'
  }
})

export const Large: StoryObj = mergeStories(Default, {
  args: {
    size: 'lg'
  }
})

export const Link: StoryObj = mergeStories(Default, {
  args: {
    link: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Basically just a link (CommonTextLink is an alias for this)'
      }
    }
  }
})

export const Text: StoryObj = mergeStories(Default, {
  args: {
    text: true
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

export const FullWidth: StoryObj = mergeStories(Default, {
  args: {
    default: 'Full width button'
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

export const Submit: StoryObj = mergeStories(Default, {
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

export const LeftIcon: StoryObj = mergeStories(Default, {
  args: {
    iconLeft: XMarkIcon
  }
})

export const RightIcon: StoryObj = mergeStories(Default, {
  args: {
    iconRight: XMarkIcon
  }
})

export const IconOnBothSides: StoryObj = mergeStories(Default, {
  args: {
    iconRight: XMarkIcon,
    iconLeft: XMarkIcon
  }
})

export const IconOnly: StoryObj = mergeStories(Default, {
  args: {
    iconLeft: XMarkIcon,
    hideText: true
  }
})

export const LoadingStateBasic: StoryObj = mergeStories(Default, {
  args: {
    loading: true,
    hideText: true
  }
})

export const LoadingStateWithText: StoryObj = mergeStories(Default, {
  args: {
    loading: true,
    default: 'Custom text'
  }
})
