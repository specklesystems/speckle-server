<template>
  <v-card
    class="elevation-20"
    :style="`${serverInfo.inviteOnly ? 'border: 2px solid #047EFB' : ''}`"
    rounded="lg"
  >
    <div
      v-show="serverInfo.inviteOnly"
      class="caption text-center"
      style="background: #047efb"
    >
      <v-icon small>mdi-shield-alert-outline</v-icon>
      This Speckle server is invite only.
    </div>
    <v-card-title class="justify-center pt-5 pb-2 hidden-md-and-up">
      <v-img src="@/assets/logo.svg" max-width="30" />
    </v-card-title>
    <v-card-title class="justify-center pt-5 pb-2">
      <span class="hidden-md-and-up mr-2 primary--text">Speckle:</span>
      Connectivity in seconds
    </v-card-title>
    <auth-strategies :strategies="strategies" :app-id="appId" :challenge="challenge" />
    <div v-if="hasLocalStrategy">
      <v-card-title class="justify-center pb-5 pt-0 body-1 text--secondary">
        <v-divider class="mx-4"></v-divider>
        Login with email & password
        <v-divider class="mx-4"></v-divider>
      </v-card-title>
      <v-alert
        v-model="registrationError"
        type="error"
        :icon="null"
        text
        multi-line
        dismissible
      >
        <v-row align="center">
          <v-col class="grow">
            {{ errorMessage }}
          </v-col>
          <v-col
            v-if="errorMessage.toLowerCase().includes('email taken')"
            class="shrink"
          >
            <v-btn color="primary" plain :to="loginRoute">Login</v-btn>
          </v-col>
        </v-row>
      </v-alert>
      <v-card-text>
        <v-form ref="form" class="px-3" @submit.prevent="loginUser()">
          <v-row style="margin-top: -10px" dense>
            <v-col cols="12">
              <v-text-field
                v-model="form.email"
                label="your email"
                :rules="validation.emailRules"
                filled
                single-line
                prepend-icon="mdi-email"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.password"
                label="password"
                type="password"
                :rules="validation.passwordRules"
                filled
                single-line
                style="margin-top: -12px"
                prepend-icon="mdi-form-textbox-password"
              />
            </v-col>
            <v-col cols="12">
              <v-btn block large color="primary" type="submit" @click="loginUser()">
                Log in
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-title class="justify-center caption">
        <div class="mx-4 align-self-center">Don't have an account?</div>
        <div class="mx-4 align-self-center">
          <v-btn
            color="primary"
            text
            :to="!fe2MessagingEnabled ? registerRoute : undefined"
            :href="fe2MessagingEnabled ? registerRoute : undefined"
          >
            Register
          </v-btn>
        </div>
      </v-card-title>
      <div class="justify-center caption text-center pb-5">
        <div class="mx-4 align-self-center">
          <a href="/authn/resetpassword" class="text-decoration-none">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
    <div class="d-block d-md-none pa-8 pt-0">
      <v-row align="center" justify="center" class="pt-4 pb-5">
        <v-col cols="12" class="pb-0">
          <div class="d-flex align-center">
            <h3 class="text-h6 font-weight-bold ml-1">This is the Legacy Web App</h3>
          </div>
          <p class="mb-0 mt-1 primary--text text--disabled mr-2">
            A better and more powerful web app is replacing this.
          </p>
        </v-col>

        <v-col cols="12" class="d-flex justify-end">
          <v-row align="center" justify="center">
            <v-col cols="12" lg="8" class="d-flex justify-end">
              <v-btn
                href="https://app.speckle.systems/"
                color="primary"
                block
                class="align-self-center outlined ml-4"
              >
                New web app
                <v-icon right>mdi-rocket-launch</v-icon>
              </v-btn>
            </v-col>
            <v-col cols="12" lg="4" class="d-flex justify-end py-0">
              <v-btn
                href="https://speckle.systems/blog/the-new-way-to-collaborate-in-aec/"
                outlined
                target="_blank"
                block
                class="align-self-center outlined ml-4"
              >
                Learn more
                <v-icon right>mdi-open-in-new</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script>
import { gql } from '@apollo/client/core'
import AuthStrategies from '@/main/components/auth/AuthStrategies.vue'
import { randomString } from '@/helpers/randomHelpers'
import { isEmailValid } from '@/plugins/authHelpers'
import {
  getInviteTokenFromRoute,
  processSuccessfulAuth
} from '@/main/lib/auth/services/authService'
import { AppLocalStorage } from '@/utils/localStorage'
import { useFE2Messaging } from '@/main/lib/core/composables/server'

export default {
  name: 'TheLogin',
  components: {
    AuthStrategies
  },
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            adminContact
            termsOfService
            inviteOnly
            scopes {
              name
              description
            }
            authStrategies {
              id
              name
              color
              icon
              url
            }
          }
        }
      `
    }
  },
  setup() {
    const { fe2MessagingEnabled, migrationMovedTo } = useFE2Messaging()

    return {
      fe2MessagingEnabled,
      migrationMovedTo
    }
  },
  data: () => ({
    serverInfo: { authStrategies: [] },
    form: { email: null, password: null },
    validation: {
      passwordRules: [(v) => !!v || 'Required'],
      emailRules: [
        (v) => !!v || 'E-mail is required',
        (v) => isEmailValid(v) || 'E-mail must be valid'
      ]
    },
    registrationError: false,
    errorMessage: '',
    serverApp: null,
    appId: null,
    challenge: null,
    loading: false,
    showNewSpeckleAccountCreationDialog: false
  }),
  computed: {
    strategies() {
      return this.serverInfo.authStrategies.filter((s) => s.id !== 'local')
    },
    hasLocalStrategy() {
      return this.serverInfo.authStrategies.findIndex((s) => s.id === 'local') !== -1
    },
    token() {
      return getInviteTokenFromRoute(this.$route)
    },
    registerRoute() {
      if (this.fe2MessagingEnabled) {
        // If fe2MessagingEnabled is true, return the migration URL
        const migrationUrl = new URL('/authn/register', this.migrationMovedTo)
        if (this.token) {
          migrationUrl.searchParams.set('token', this.token)
        }
        return migrationUrl.href
      } else {
        // If fe2MessagingEnabled is false, return the Vue Router route object
        return {
          name: 'Register',
          query: {
            appId: this.$route.query.appId,
            challenge: this.$route.query.challenge,
            token: this.token
          }
        }
      }
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const appId = urlParams.get('appId')
    const challenge = urlParams.get('challenge')

    this.$mixpanel.track('Visit Log In')

    if (!appId) this.appId = 'spklwebapp'
    else this.appId = appId

    if (!challenge && this.appId === 'spklwebapp') {
      this.challenge = randomString(10)
      AppLocalStorage.set('appChallenge', this.challenge)
    } else if (challenge) {
      this.challenge = challenge
    }
  },
  methods: {
    async loginUser() {
      try {
        const valid = this.$refs.form.validate()
        if (!valid) return

        const user = {
          email: this.form.email,
          password: this.form.password
        }

        if (this.loading) return
        this.loading = true

        const res = await fetch(`/auth/local/login?challenge=${this.challenge}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow', // obvs not working
          body: JSON.stringify(user)
        })

        // A redirect status code means success
        if (res.redirected) {
          this.$mixpanel.track('Log In', { type: 'action' })
          processSuccessfulAuth(res)
          this.loading = false
          return
        }

        const data = await res.json()
        if (data.err) throw new Error(data.message)
      } catch (err) {
        this.errorMessage = err.message
        this.registrationError = true
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
