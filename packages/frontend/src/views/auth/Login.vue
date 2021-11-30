<template>
  <v-card
    class="elevation-20"
    :style="`${serverInfo.inviteOnly ? 'border: 2px solid #047EFB' : ''}`"
    rounded="lg"
  >
    <div v-show="serverInfo.inviteOnly" class="caption text-center" style="background: #047efb">
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
    <strategies :strategies="strategies" :app-id="appId" :challenge="challenge" :suuid="suuid" />
    <div v-if="hasLocalStrategy">
      <v-card-title class="justify-center pb-5 pt-0 body-1 text--secondary">
        <v-divider class="mx-4"></v-divider>
        Login with email & password
        <v-divider class="mx-4"></v-divider>
      </v-card-title>
      <v-alert v-model="registrationError" type="error" :icon="null" text multi-line dismissible>
        <v-row align="center">
          <v-col class="grow">
            {{ errorMessage }}
          </v-col>
          <v-col v-if="errorMessage.toLowerCase().includes('email taken')" class="shrink">
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
              <v-btn block large color="primary" type="submit" @click="loginUser()">Log in</v-btn>
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
          <a href="/authn/resetpassword" class="text-decoration-none">Forgot your password?</a>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import crs from 'crypto-random-string'
import Strategies from '@/components/auth/Strategies'
import { isEmailValid } from '@/auth-helpers'

export default {
  name: 'Login',
  components: { Strategies },
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
    suuid: null,
    challenge: null,
    inviteId: null
  }),
  computed: {
    strategies() {
      return this.serverInfo.authStrategies.filter((s) => s.id !== 'local')
    },
    hasLocalStrategy() {
      return this.serverInfo.authStrategies.findIndex((s) => s.id === 'local') !== -1
    },
    registerRoute() {
      return {
        name: 'Register',
        query: {
          appId: this.$route.query.appId,
          challenge: this.$route.query.challenge,
          suuid: this.$route.query.suuid
        }
      }
    }
  },
  mounted() {
    let urlParams = new URLSearchParams(window.location.search)
    let appId = urlParams.get('appId')
    let challenge = urlParams.get('challenge')
    let suuid = urlParams.get('suuid')
    this.suuid = suuid
    let inviteId = urlParams.get('inviteId')
    this.inviteId = inviteId

    if (!appId) this.appId = 'spklwebapp'
    else this.appId = appId

    if (!challenge && this.appId === 'spklwebapp') {
      this.challenge = crs({ length: 10 })
      localStorage.setItem('appChallenge', this.challenge)
    } else if (challenge) {
      this.challenge = challenge
    }
  },
  methods: {
    async loginUser() {
      try {
        let valid = this.$refs.form.validate()
        if (!valid) return

        let user = {
          email: this.form.email,
          password: this.form.password
        }

        if (this.suuid) user.suuid = this.suuid

        let res = await fetch(`/auth/local/login?challenge=${this.challenge}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow', // obvs not working
          body: JSON.stringify(user)
        })

        if (res.redirected) {
          window.location = res.url
          return
        }

        let data = await res.json()
        if (data.err) throw new Error(data.message)
      } catch (err) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  }
}
</script>
