import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutPanel from '~~/src/components/layout/Panel.vue'

export default {
  component: LayoutPanel,
  parameters: {
    docs: {
      description: {
        component: 'A basic panel that can be used as a basis for various cards/panels'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutPanel },
    setup() {
      return { args }
    },
    template: `
      <div>
        <LayoutPanel v-bind="args">
          <template #default>
            Default slot
          </template>
          <template #header>
            Header slot
          </template>
          <template #footer>
            Footer slot
          </template>
        </LayoutPanel>
      </div>
    `
  }),
  args: {
    form: false,
    ring: false,
    customPadding: false,
    fancyGlow: false,
    noShadow: false
  }
}

export const CustomPadding: StoryObj = {
  render: (args) => ({
    components: { LayoutPanel },
    setup() {
      return { args }
    },
    template: `
      <div>
        <LayoutPanel v-bind="args">
          <template #default>
            <div class="p-2">
              Default slot
            </div>
          </template>
          <template #header>
            Header slot (no padding)
          </template>
          <template #footer>
            <div class="p-8">
              Footer slot (big padding)
            </div>
          </template>
        </LayoutPanel>
      </div>
    `
  }),
  args: {
    form: false,
    ring: false,
    customPadding: true
  }
}

export const WithRingOutline = {
  ...Default,
  args: {
    ...Default.args,
    ring: true
  }
}

export const WithFancyGlow = {
  ...Default,
  args: {
    ...Default.args,
    fancyGlow: true
  }
}

export const NoShadow = {
  ...Default,
  args: {
    ...Default.args,
    noShadow: true
  }
}
