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
      Interoperability in seconds
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
          <v-btn color="primary" text :to="registerRoute">Register</v-btn>
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

export default {
  name: 'TheLogin',
  components: { AuthStrategies },
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
    loading: false
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
      return {
        name: 'Register',
        query: {
          appId: this.$route.query.appId,
          challenge: this.$route.query.challenge,
          token: this.token
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
