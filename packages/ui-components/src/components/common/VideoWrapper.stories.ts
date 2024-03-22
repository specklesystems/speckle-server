import type { Meta, StoryObj } from '@storybook/vue3'
import CommonVideoWrapper from '~~/src/components/common/VideoWrapper.vue'

type StoryType = StoryObj<{
  autoplay: boolean
  muted: boolean
  controls: boolean
  vimeoId: string
}>

export default {
  title: 'Components/Common/VideoWrapper',
  component: CommonVideoWrapper,
  argTypes: {
    autoplay: {
      control: { type: 'boolean' },
      defaultValue: false
    },
    muted: {
      control: { type: 'boolean' },
      defaultValue: false
    },
    controls: {
      control: { type: 'boolean' },
      defaultValue: false
    },
    vimeoId: {
      control: { type: 'text' }
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A wrapper component for Vimeo video embeds with configurable options for autoplay, muted audio, and visibility of controls.'
      }
    }
  }
} as Meta<typeof CommonVideoWrapper>

export const Default: StoryType = {
  render: (args) => ({
    components: { CommonVideoWrapper },
    setup: () => ({ args }),
    template: '<CommonVideoWrapper v-bind="args" />'
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
