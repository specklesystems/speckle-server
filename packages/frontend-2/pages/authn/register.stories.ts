import { Meta, StoryObj } from '@storybook/vue3'
import RegisterPage from '~~/pages/authn/register.vue'
import LoginOrRegisterLayout from '~~/layouts/loginOrRegister.vue'
import { mockLoginServerInfoQuery } from '~~/lib/auth/mocks/serverInfo'

export default {
  title: 'Pages/Authn/Register',
  component: RegisterPage,
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 1000
      }
    },
    layout: 'fullscreen',
    manualLayout: true
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { RegisterPage, LoginOrRegisterLayout },
    setup: () => ({ args }),
    template: `<LoginOrRegisterLayout><RegisterPage v-bind="args"/></LoginOrRegisterLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [mockLoginServerInfoQuery()]
    }
  }
}
