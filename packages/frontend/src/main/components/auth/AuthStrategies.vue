<template>
  <div v-if="strategies && strategies.length !== 0">
    <v-card-title class="justify-center py-2 body-1 text--secondary">
      <v-divider class="mx-4"></v-divider>
      Sign in with
      <v-divider class="mx-4"></v-divider>
    </v-card-title>
    <v-card-text class="pb-5">
      <template v-for="s in strategies">
        <v-col
          :key="s.name"
          cols="12"
          class="text-center py-1 my-0"
          @click="trackSignIn(s.name)"
        >
          <v-btn
            dark
            block
            :color="s.color"
            :href="`${s.url}?appId=${appId}&challenge=${challenge}${
              token ? '&token=' + token : ''
            }`"
          >
            <v-icon small class="mr-5">{{ s.icon }}</v-icon>
            {{ s.name }}
          </v-btn>
        </v-col>
      </template>
    </v-card-text>
  </div>
</template>
<script>
import { getInviteTokenFromRoute } from '@/main/lib/auth/services/authService'
export default {
  name: 'AuthStrategies',
  props: {
    strategies: {
      type: Array,
      default: () => []
    },
    appId: {
      type: String,
      default: () => null
    },
    challenge: {
      type: String,
      default: () => null
    }
  },
  computed: {
    token() {
      return getInviteTokenFromRoute(this.$route)
    }
  },
  methods: {
    trackSignIn(strategyName) {
      this.$mixpanel.track('Log In', {
        isInvite: this.token !== null,
        type: 'action',
        provider: strategyName
      })
    }
  }
}
</script>
