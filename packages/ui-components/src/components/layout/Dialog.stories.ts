import { Meta, StoryObj } from '@storybook/vue3'
import LayoutDialog from '~~/src/components/layout/Dialog.vue'
import FormButton from '~~/src/components/form/Button.vue'
import { ref } from 'vue'
import { action } from '@storybook/addon-actions'

export default {
  component: LayoutDialog,
  parameters: {
    docs: {
      description: {
        component: 'Standard dialog/modal window'
      }
    }
  },
  argTypes: {
    maxWidth: {
      options: ['sm', 'md', 'lg', 'xl'],
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutDialog, FormButton },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `<div>
      <FormButton @click="() => open = true">Trigger dialog</FormButton>
      <LayoutDialog v-model:open="open" v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-bold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
          <div class="flex justify-end">
            <FormButton @click="() => open = false">Close</FormButton>
          </div>
        </div>
      </LayoutDialog>
    </div>`
  }),
  args: {
    maxWidth: 'sm',
    hideCloser: false,
    preventCloseOnClickOutside: false
  }
}

export const HeaderAndFooter = {
  ...Default,
  args: {
    ...Default.args,
    title: 'Dialog Title',
    buttons: [
      {
        text: 'Close',
        props: {
          color: 'secondary',
          link: false,
          fullWidth: true,
          outline: true
        }
      },
      {
        text: 'Save',
        props: {
          color: 'default',
          link: false,
          fullWidth: true
        }
      }
    ]
  }
}

export const ManualCloseOnly = {
  ...Default,
  args: {
    ...Default.args,
    preventCloseOnClickOutside: true
  }
}

export const WithSubmit = {
  ...HeaderAndFooter,
  args: {
    ...HeaderAndFooter.args,
    onSubmit: action('submit'),
    buttons: [
      {
        text: 'Submit',
        props: {
          color: 'default',
          submit: true,
          fullWidth: true
        }
      }
    ]
  }
}

export const WithSlotButtons: StoryObj = {
  ...Default,
  args: {
    ...Default.args
  },
  render: (args) => ({
    components: { LayoutDialog, FormButton },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `<div>
      <FormButton @click="() => open = true">Trigger dialog</FormButton>
      <LayoutDialog v-model:open="open" v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-bold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
        <template #buttons>
            <FormButton @click="() => open = false">Close</FormButton>
        </template>
      </LayoutDialog>
    </div>`
  })
}
