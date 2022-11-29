import { Meta, Story } from '@storybook/vue3'
import LandingDownloadManager from '~~/components/landing/DownloadManager.vue'

export default {
  component: LandingDownloadManager
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { LandingDownloadManager },
    setup: () => ({ args }),
    template: `<LandingDownloadManager v-bind="args"/>`
  })
}
