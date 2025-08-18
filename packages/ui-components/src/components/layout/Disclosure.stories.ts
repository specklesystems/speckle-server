import { FaceSmileIcon } from '@heroicons/vue/24/outline'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import LayoutDisclosure from '~~/src/components/layout/Disclosure.vue'
import { FormButton } from '~~/src/lib'

export default {
  component: LayoutDisclosure,
  parameters: {
    docs: {
      description: {
        component: 'Standard disclosure panel'
      }
    }
  },
  argTypes: {
    color: {
      options: ['default', 'danger'],
      control: { type: 'select' }
    },
    icon: {
      type: 'function'
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutDisclosure },
    setup() {
      return { args }
    },
    template: `
    <div>
      <LayoutDisclosure v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
      </LayoutDisclosure>
    </div>`
  }),
  args: {
    title: 'Disclosure title',
    color: 'default',
    icon: FaceSmileIcon
  }
}

export const Danger: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    color: 'danger'
  }
}

export const Success: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    color: 'success'
  }
}

export const Warning: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    color: 'warning'
  }
}

export const WithModel: StoryObj = {
  render: (args) => ({
    components: { LayoutDisclosure },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
    <div>
      <div class="mb-4">
        <button @click="open = !open" class="btn btn-primary">Toggle Disclosure</button>
      </div>
      <LayoutDisclosure v-bind="args" v-model:open="open">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
      </LayoutDisclosure>
    </div>`
  }),
  args: {
    ...Default.args
  }
}

export const WithTitleActions: StoryObj = {
  render: (args) => ({
    components: { LayoutDisclosure, FormButton },
    setup() {
      const counter = ref(0)
      const increment = () => (counter.value = counter.value + 1)

      return { args, counter, increment }
    },
    template: `
    <div>
      <LayoutDisclosure v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
        <template #title-actions>
          <FormButton @click.stop="increment" class="opacity-0 group-hover/disclosure:opacity-100">Put stuff here - {{ counter }}</FormButton>
        </template>
      </LayoutDisclosure>
    </div>`
  }),
  args: {
    ...Default.args
  }
}

export const WithEditableTitle: StoryObj = {
  render: (args) => ({
    components: { LayoutDisclosure, FormButton },
    setup() {
      const title = ref("Baby's first title")
      const editTitle = ref(false)

      return { args, title, editTitle }
    },
    template: `
    <div class="flex flex-col gap-2">
      <LayoutDisclosure v-bind="args" v-model:edit-title="editTitle" v-model:title="title">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
      </LayoutDisclosure>
      <div>
        Saved/current title: {{ title }}
      </div>
      <FormButton @click="editTitle = true">Enable edit mode</FormButton>
    </div>`
  }),
  args: {
    ...Default.args
  }
}
