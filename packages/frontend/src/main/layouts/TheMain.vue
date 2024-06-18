<template>
  <v-app id="speckle">
    <v-navigation-drawer
      ref="navDrawer"
      v-model="drawer"
      app
      floating
      :class="`main-nav-drawer grey ${
        $vuetify.theme.dark ? 'darken-4' : 'lighten-4'
      } elevation-1`"
      :width="navWidth"
      style="z-index: 100"
    >
      <div v-show="$route.meta.resizableNavbar" class="nav-resizer"></div>
      <main-nav :expanded="drawer" @hide-drawer="drawer = false" />
      <template #append>
        <div
          :xxxstyle="`${$isMobile() ? 'padding-bottom: 58px' : ''}`"
          class="elevation-10"
        >
          <main-nav-bottom />
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app class="elevation-0 transparent" flat style="margin-top: 4px">
      <v-card
        class="d-flex flex-grow-1 overflow-hidden align-center elevation-4 rounded-lg"
        style="height: 48px"
      >
        <div v-if="!drawer">
          <v-app-bar-nav-icon @click.stop="drawer = !drawer">
            <v-icon>{{ drawer ? 'mdi-backburger' : 'mdi-menu' }}</v-icon>
          </v-app-bar-nav-icon>
        </div>
        <div v-else class="ml-4"></div>
        <div class="d-flex align-center overflow-hidden flex-shrink-1">
          <portal-target name="toolbar" class="text-truncate" />
        </div>
        <div class="d-flex text-right flex-grow-1 justify-end">
          <portal-target name="actions" class="d-flex align-center">
            <div style="margin-right: -10px">
              <search-bar />
            </div>
          </portal-target>
        </div>
      </v-card>
    </v-app-bar>
    <v-main class="background">
      <email-verification-banner
        v-if="!hideEmailBanner"
        class="my-2 mx-4 email-banner"
      ></email-verification-banner>
      <new-speckle-dialog v-if="showNewSpeckleDialog && fe2MessagingEnabled" />
      <v-container fluid class="px-4">
        <transition name="fade">
          <router-view></router-view>
        </transition>
      </v-container>
    </v-main>
    <global-toast />
    <global-loading />
  </v-app>
</template>
<script>
import { gql } from '@apollo/client/core'
import { useNavigationDrawerAutoResize } from '../lib/core/composables/dom'
import { ref } from 'vue'
import { useIsLoggedIn } from '../lib/core/composables/core'
import { AppLocalStorage } from '@/utils/localStorage'
import { useFE2Messaging } from '@/main/lib/core/composables/server'

export default {
  name: 'TheMain',
  components: {
    MainNav: () => import('@/main/navigation/MainNav'),
    MainNavBottom: () => import('@/main/navigation/MainNavBottom'),
    SearchBar: () => import('@/main/components/common/SearchBar'),
    GlobalToast: () => import('@/main/components/common/GlobalToast'),
    GlobalLoading: () => import('@/main/components/common/GlobalLoading'),
    NewSpeckleDialog: () => import('@/main/dialogs/NewSpeckle.vue'),
    EmailVerificationBanner: () =>
      import('@/main/components/user/EmailVerificationBanner')
  },
  apollo: {
    $subscribe: {
      userStreamAdded: {
        query: gql`
          subscription userStreamAdded {
            userStreamAdded
          }
        `,
        result({ data }) {
          if (!data || !data.userStreamAdded) return
          if (this.$route.params.streamId === data.userStreamAdded.id) return
          this.$eventHub.$emit('notification', {
            text: `You've got a new stream!`,
            action: {
              name: 'View Stream',
              to: `/streams/${data.userStreamAdded.id}`
            }
          })
        },
        skip() {
          return !this.isLoggedIn
        }
      }
    }
  },
  setup() {
    const navDrawer = ref(null)
    const showNewSpeckleDialog = ref(true)

    const { navWidth } = useNavigationDrawerAutoResize({
      drawerRef: navDrawer
    })

    const { isLoggedIn } = useIsLoggedIn()

    // drawer ref must be returned, for it to be filled
    return {
      navDrawer,
      navWidth,
      isLoggedIn,
      showNewSpeckleDialog,
      ...useFE2Messaging()
    }
  },
  data() {
    return {
      newStreamDialog: 1,
      drawer: true,
      hideEmailBanner: false
    }
  },
  watch: {
    $route: {
      handler(to) {
        this.hideEmailBanner = !!to.meta.hideEmailBanner
      },
      immediate: true
    },
    '$route.query.emailverifiedstatus': {
      handler(emailVerifiedStatus, oldStatus) {
        if (!oldStatus && emailVerifiedStatus === 'true') {
          this.$triggerNotification({
            text: '✉️ Email successfully verified!',
            type: 'success'
          })

          this.cleanQuery()
        }
      },
      immediate: true
    },
    '$route.query.emailverifiederror': {
      handler(emailVerifiedError, oldError) {
        if (!oldError && emailVerifiedError) {
          this.$triggerNotification({
            text: `✉️ ${emailVerifiedError}`,
            type: 'error'
          })

          this.cleanQuery()
        }
      },
      immediate: true
    }
  },
  mounted() {
    const dialogDismissed = AppLocalStorage.get('newSpeckleDialogDismissed')
    this.showNewSpeckleDialog = dialogDismissed !== 'true'
  },
  methods: {
    cleanQuery() {
      this.$router.replace({ ...this.$router.currentRoute, query: '' })
    }
  }
}
</script>
<style scoped>
.email-banner {
  z-index: 2;
}
</style>
