import type { Nullable } from '@speckle/shared'
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import ToastRenderer from '~~/src/components/global/ToastRenderer.vue'
import FormButton from '~~/src/components/form/Button.vue'
import { ToastNotificationType } from '~~/src/helpers/global/toast'
import type { ToastNotification } from '~~/src/helpers/global/toast'
import { useGlobalToast } from '~~/src/stories/composables/toast'

type StoryType = StoryObj<{ notification: ToastNotification }>

export default {
  component: ToastRenderer,
  parameters: {
    docs: {
      description: {
        component:
          'Use this to render toast notifications. You must wrap this with some sort of global toast notification manager yourself, cause the solution for that will depend on the app. This component only handles actually rendering the notification.'
      }
    }
  },
  argTypes: {
    notification: {
      description: 'ToastNotification type object, nullable'
    },
    'update:notification': {
      description:
        "Notification prop update event. Enables two-way binding through 'v-model:notification'"
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args) => ({
    components: { ToastRenderer, FormButton },
    setup() {
      const { triggerNotification } = useGlobalToast()
      const notification = ref(null as Nullable<ToastNotification>)
      const onClick = () => {
        triggerNotification(args.notification)
      }
      return { args, onClick, notification }
    },
    template: `
      <div>
        <FormButton @click="onClick">Trigger!</FormButton>
      </div>
    `
  }),
  parameters: {
    docs: {
      source: {
        code: '<GlobalToastRenderer v-model:notification="notification"/>'
      }
    }
  },
  args: {
    notification: {
      type: ToastNotificationType.Info,
      title: 'Title',
      description: 'Description',
      cta: {
        title: 'CTA',
        onClick: () => console.log('Clicked')
      }
    }
  }
}

export const WithManualClose: StoryType = {
  ...Default,
  args: {
    notification: {
      ...Default.args!.notification!,
      autoClose: false
    }
  }
}
