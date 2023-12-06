import type { Meta, StoryObj } from '@storybook/vue3'
import SourceAppBadge from '~~/src/components/SourceAppBadge.vue'
import { SourceApps } from '@speckle/shared'

export default {
  component: SourceAppBadge,
  parameters: {
    docs: {
      description: {
        component: 'Speckle source application badge.'
      }
    }
  },
  argTypes: {
    sourceApp: {
      options: SourceApps.slice().map((a) => a.name),
      control: { type: 'select' },
      description: "Import 'SourceApps' from '@speckle/shared'"
    }
  }
} as Meta

export const Default: StoryObj<{ sourceApp: string }> = {
  render: (args) => ({
    components: { SourceAppBadge },
    setup() {
      const chosenSourceAppName = args.sourceApp
      const sourceApp =
        SourceApps.find((a) => a.name === chosenSourceAppName) || SourceApps[0]
      return { sourceApp }
    },
    template: `<div><SourceAppBadge :source-app="sourceApp"/></div>`
  }),
  args: {
    sourceApp: SourceApps[0].name
  }
}
