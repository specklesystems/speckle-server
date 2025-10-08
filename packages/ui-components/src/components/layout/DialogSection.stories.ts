import { FaceSmileIcon } from '@heroicons/vue/24/outline'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import DialogSection from '~~/src/components/layout/DialogSection.vue'
import { FormButton } from '~~/src/lib'

export default {
  component: DialogSection,
  parameters: {
    docs: {
      description: {
        component: 'Section to use in Dialogs'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { DialogSection },
    setup() {
      return { args }
    },
    template: `
    <div class="bg-foundation">
      <DialogSection v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
      </DialogSection>
    </div>`
  }),
  args: {
    title: 'Dialog Section Title',
    icon: FaceSmileIcon,
    borderT: true,
    borderB: true
  }
}

export const NoBorders: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    borderT: false,
    borderB: false
  }
}

export const WithButton: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    button: {
      text: 'Button Label',
      to: 'https://www.google.com'
    }
  }
}

export const AlwaysOpen: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    alwaysOpen: true
  }
}

export const ButtonExpandsContent: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    button: {
      text: 'Delete',
      expandContent: true,
      color: 'danger'
    }
  }
}

export const WithModel: StoryObj = {
  ...Default,
  render: (args) => ({
    components: { DialogSection, FormButton },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
    <div class="bg-foundation flex flex-col gap-2">
      <DialogSection v-bind="args" v-model:open="open">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
      </DialogSection>
      <FormButton @click="open = !open">{{ open ? 'Close' : 'Open' }} Section</FormButton>
    </div>`
  }),
  args: {
    ...Default.args
  }
}
