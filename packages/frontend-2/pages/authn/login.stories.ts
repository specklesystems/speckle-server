import { Meta } from '@storybook/vue3'
import LoginPage from '~~/pages/authn/login.vue'
import LoginOrRegisterLayout from '~~/layouts/loginOrRegister.vue'
import { mockLoginServerInfoQuery } from '~~/lib/auth/mocks/serverInfo'
import { buildPageStory } from '~~/lib/common/helpers/storybook'

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

export const Default = buildPageStory({
  page: LoginPage,
  layout: LoginOrRegisterLayout,
  story: {
    parameters: {
      apolloClient: {
        mocks: [mockLoginServerInfoQuery()]
      }
    }
  },
  activeUserSettings: {
    isLoggedIn: false
  }
})
