import { Nullable } from '@speckle/shared'
import { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import ToastRenderer from '~~/src/components/global/ToastRenderer.vue'
import FormButton from '~~/src/components/form/Button.vue'
import { ToastNotification, ToastNotificationType } from '~~/src/helpers/global/toast'

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

export const Default: StoryObj = {
  render: (args) => ({
    components: { ToastRenderer, FormButton },
    setup() {
      const notification = ref(null as Nullable<ToastNotification>)
      const onClick = () => {
        notification.value = {
          type: ToastNotificationType.Info,
          title: 'Title',
          description: 'Description',
          cta: {
            title: 'CTA',
            onClick: () => console.log('Clicked')
          }
        }

        // Clear after 2s
        setTimeout(() => (notification.value = null), 2000)
      }
      return { args, onClick, notification }
    },
    template: `
      <div>
        <FormButton @click="onClick">Trigger!</FormButton>
        <ToastRenderer v-model:notification="notification"/>
      </div>
    `
  }),
  parameters: {
    docs: {
      source: {
        code: '<GlobalToastRenderer v-model:notification="notification"/>'
      }
    }
  }
}
