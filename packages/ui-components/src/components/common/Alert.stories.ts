import { FaceSmileIcon } from '@heroicons/vue/24/solid'
import type { Meta, StoryObj } from '@storybook/vue3'
import CommonAlert from '~~/src/components/common/Alert.vue'

export default {
  component: CommonAlert,
  argTypes: {
    color: {
      options: ['success', 'danger', 'warning', 'info'],
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonAlert },
    setup() {
      return { args }
    },
    template: `
      <CommonAlert v-bind="args">
        <template #title>
          Some title
        </template>
        <template #description>
          Some description
        </template>
      </CommonAlert>
    `
  }),
  args: {
    color: 'success',
    withDismiss: false,
    actions: [
      { title: 'View', url: 'https://google.com' },
      { title: 'Open', onClick: () => console.log('click') }
    ]
  }
}

export const WithDismisser = {
  ...Default,
  args: {
    ...Default.args,
    withDismiss: true
  }
}

export const WithoutDescription: StoryObj = {
  render: (args) => ({
    components: { CommonAlert },
    setup() {
      return { args }
    },
    template: `
      <CommonAlert v-bind="args">
        <template #title>
          Some title
        </template>
      </CommonAlert>
    `
  }),
  args: {
    ...Default.args
  }
}

export const WithoutDescriptionAndWithDismisser = {
  ...WithoutDescription,
  args: {
    ...WithoutDescription.args,
    withDismiss: true
  }
}

export const WithoutActions = {
  ...Default,
  args: {
    ...Default.args,
    actions: undefined
  }
}

export const WithoutDescriptionAndActions = {
  ...WithoutDescription,
  args: {
    ...WithoutDescription.args,
    actions: undefined
  }
}

export const Info = {
  ...Default,
  args: {
    ...Default.args,
    color: 'info'
  }
}

export const Danger = {
  ...Default,
  args: {
    ...Default.args,
    color: 'danger'
  }
}

export const Warning = {
  ...Default,
  args: {
    ...Default.args,
    color: 'warning'
  }
}

export const CustomIcon = {
  ...WithoutDescriptionAndActions,
  args: {
    ...WithoutDescriptionAndActions.args,
    customIcon: FaceSmileIcon
  }
}

export const XtraSmall = {
  ...WithoutDescriptionAndActions,
  args: {
    ...WithoutDescriptionAndActions.args,
    size: 'xs'
  }
}

export const XtraSmallDescription = {
  ...WithoutActions,
  args: {
    ...WithoutActions.args,
    size: 'xs'
  }
}

export const XtraSmallActions = {
  ...WithoutDescription,
  args: {
    ...WithoutDescription.args,
    size: 'xs'
  }
}

export const XtraSmallFull = {
  ...WithDismisser,
  args: {
    ...WithDismisser.args,
    size: 'xs'
  }
}
