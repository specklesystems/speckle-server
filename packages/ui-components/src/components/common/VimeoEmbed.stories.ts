import type { Meta, StoryObj } from '@storybook/vue3'
import CommonVimeoEmbed from '~~/src/components/common/VimeoEmbed.vue'

type StoryType = StoryObj<{
  autoplay: boolean
  muted: boolean
  controls: boolean
  vimeoId: string
  darkPlaceholder?: string
  lightPlaceholder?: string
  placeholderAlt?: string
}>

export default {
  title: 'Components/Common/VimeoEmbed',
  component: CommonVimeoEmbed,
  argTypes: {
    autoplay: {
      control: { type: 'boolean' }
    },
    muted: {
      control: { type: 'boolean' }
    },
    controls: {
      control: { type: 'boolean' }
    },
    vimeoId: {
      control: { type: 'text' }
    },
    darkPlaceholder: {
      control: { type: 'text' }
    },
    lightPlaceholder: {
      control: { type: 'text' }
    },
    placeholderAlt: {
      control: { type: 'text' }
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A wrapper component for Vimeo video embeds with configurable options for autoplay, muted audio, and visibility of controls. Also supports custom placeholders for light/dark themes with a play button overlay.'
      }
    }
  }
} as Meta<typeof CommonVimeoEmbed>

export const Default: StoryType = {
  render: (args) => ({
    components: { CommonVimeoEmbed },
    setup: () => ({ args }),
    template: '<CommonVimeoEmbed v-bind="args" />'
  }),
  args: {
    autoplay: false,
    muted: false,
    controls: true,
    vimeoId: '925894349'
  }
}

export const NoControls: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    controls: false
  }
}

export const WithPlaceholder: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    darkPlaceholder: 'https://picsum.photos/800/450?random=1',
    lightPlaceholder: 'https://picsum.photos/800/450?random=2',
    placeholderAlt: 'Example video placeholder'
  }
}

export const AutoplayWithoutPlaceholder: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    autoplay: true
  }
}
