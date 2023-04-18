import { Meta, StoryObj } from '@storybook/vue3'
import LoginPage from '~~/pages/authn/login.vue'
import LoginOrRegisterLayout from '~~/layouts/loginOrRegister.vue'
import { mockLoginServerInfoQuery } from '~~/lib/auth/mocks/serverInfo'

export default {
  title: 'Pages/Authn/Login',
  component: LoginPage,
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
    components: { LoginPage, LoginOrRegisterLayout },
    setup: () => ({ args }),
    template: `<LoginOrRegisterLayout><LoginPage v-bind="args"/></LoginOrRegisterLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [mockLoginServerInfoQuery()]
    }
  }
}
