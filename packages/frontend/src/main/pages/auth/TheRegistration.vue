<template>
  <v-card
    class="elevation-20"
    rounded="lg"
    :style="`${serverInfo.inviteOnly ? 'border: 2px solid #047EFB' : ''}`"
  >
    <div
      v-show="serverInfo.inviteOnly"
      class="caption text-center"
      style="background: #047efb"
    >
      <v-icon small>mdi-shield-alert-outline</v-icon>
      This Speckle server is invite only.
    </div>
    <v-alert v-if="serverInfo.inviteOnly && !token" type="info">
      This server is invite only. If you have received an invitation email, please
      follow the instructions in it.
    </v-alert>
    <div v-else>
      <v-card-title class="justify-center pt-5 pb-2 hidden-md-and-up">
        <v-img src="@/assets/logo.svg" max-width="30" />
      </v-card-title>
      <v-card-title class="justify-center pt-5 pb-2">
        <span class="hidden-md-and-up mr-2 primary--text">Speckle:</span>
        Interoperability in seconds
      </v-card-title>
      <auth-strategies
        :strategies="strategies"
        :app-id="appId"
        :challenge="challenge"
      />
      <v-card-title class="justify-center pb-5 pt-0 body-1 text--secondary">
        <v-divider class="mx-4"></v-divider>
        Create an account
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
        <v-form ref="form" class="px-3">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                id="email"
                v-model="form.email"
                label="your email"
                :rules="validation.emailRules"
                :readonly="loading"
                filled
                single-line
                prepend-icon="mdi-email"
                name="email"
                type="email"
                autocomplete="username"
              />
            </v-col>
            <v-col cols="12" sm="12">
              <v-text-field
                v-model="form.firstName"
                label="name"
                :rules="validation.nameRules"
                :readonly="loading"
                filled
                single-line
                style="margin-top: -12px"
                prepend-icon="mdi-account"
              />
            </v-col>
            <v-col cols="12" sm="12">
              <v-text-field
                v-model="form.company"
                label="company/team"
                :rules="validation.companyRules"
                :readonly="loading"
                filled
                single-line
                style="margin-top: -12px"
                prepend-icon="mdi-office-building"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                id="new-password"
                v-model="password"
                label="password"
                type="password"
                autocomplete="new-password"
                :rules="validation.passwordRules"
                :readonly="loading"
                filled
                single-line
                style="margin-top: -12px"
                prepend-icon="mdi-form-textbox-password"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                id="confirm-password"
                v-model="passwordConfirmation"
                label="confirm password"
                type="password"
                autocomplete="new-password"
                :rules="validation.passwordRules"
                :readonly="loading"
                filled
                single-line
                style="margin-top: -12px"
              />
            </v-col>
            <v-col cols="12" class="py-2 pl-9" style="margin-top: -18px">
              <v-row
                v-show="passwordStrength !== 1 && password"
                no-gutters
                align="center"
              >
                <v-col
                  cols="12"
                  class="flex-grow-1 flex-shrink-0"
                  style="min-width: 100px; max-width: 100%"
                >
                  <v-progress-linear
                    v-model="passwordStrength"
                    height="5"
                    class="mt-1 mb-0"
                    :color="`${
                      passwordStrength >= 75 && password === passwordConfirmation
                        ? 'green'
                        : passwordStrength >= 50 && password === passwordConfirmation
                        ? 'orange'
                        : 'red'
                    }`"
                  ></v-progress-linear>
                </v-col>
                <v-col cols="12" class="caption text-center mt-3">
                  {{
                    passwordSuggestion
                      ? passwordSuggestion
                      : password && password === passwordConfirmation
                      ? 'Looks good.'
                      : null
                  }}
                  <div v-if="password !== passwordConfirmation">
                    <b>Passwords do not match.</b>
                  </div>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <v-btn
                block
                large
                color="primary"
                :disabled="loading"
                @click="registerUser"
              >
                Create Account
              </v-btn>
              <p class="text-center"></p>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </div>
    <v-card-title
      :class="`justify-center caption ${serverInfo.inviteOnly && !token ? 'pt-0' : ''}`"
    >
      <div class="mx-4 align-self-center">Already have an account?</div>
      <div class="mx-4 align-self-center">
        <v-btn color="primary" plain text :to="loginRoute">Login</v-btn>
      </div>
    </v-card-title>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import { randomString } from '@/helpers/randomHelpers'

import AuthStrategies from '@/main/components/auth/AuthStrategies.vue'
import { isEmailValid } from '@/plugins/authHelpers'
import {
  getInviteTokenFromRoute,
  processSuccessfulAuth
} from '@/main/lib/auth/services/authService'
import { AppLocalStorage } from '@/utils/localStorage'
import { useValidatablePasswordEntry } from '@/main/lib/auth/composables/useValidatablePasswordEntry'

export default {
  name: 'TheRegistration',
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
  setup() {
    const validatablePasswordEntry = useValidatablePasswordEntry()
    return {
      ...validatablePasswordEntry
    }
  },
  data() {
    return {
      serverInfo: { authStrategies: [] },
      form: {
        email: null,
        firstName: null,
        lastName: null,
        company: null
      },
      registrationError: false,
      errorMessage: '',
      validation: {
        // companyRules: [(v) => !!v || 'Required'],
        passwordRules: [(v) => !!v || 'Required'],
        nameRules: [
          (v) => !!v || 'Required',
          (v) => (v && v.length <= 60) || 'Name must be less than 10 characters'
        ],
        emailRules: [
          (v) => !!v || 'E-mail is required',
          (v) => isEmailValid(v) || 'E-mail must be valid'
        ]
      },
      appId: null,
      challenge: null,
      loading: false
    }
  },
  computed: {
    token() {
      return getInviteTokenFromRoute(this.$route)
    },
    loginRoute() {
      return {
        name: 'Login',
        query: {
          appId: this.$route.query.appId,
          challenge: this.$route.query.challenge,
          token: this.token
        }
      }
    },
    strategies() {
      return this.serverInfo.authStrategies.filter((s) => s.id !== 'local')
    },
    hasLocalStrategy() {
      return this.serverInfo.authStrategies.findIndex((s) => s.id === 'local') !== -1
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const appId = urlParams.get('appId')
    const challenge = urlParams.get('challenge')

    this.$mixpanel.track('Visit Sign Up')

    if (!appId) this.appId = 'spklwebapp'
    else this.appId = appId

    if (!challenge && this.appId === 'spklwebapp') {
      this.challenge = randomString({ length: 10 })
      AppLocalStorage.set('appChallenge', this.challenge)
    } else if (challenge) {
      this.challenge = challenge
    }
  },
  methods: {
    async registerUser() {
      if (this.loading) return

      try {
        const valid = this.$refs.form.validate()
        if (!valid) return
        this.validatePassword()

        this.loading = true

        await this.validatePasswordStrength()

        const user = {
          email: this.form.email,
          company: this.form.company,
          password: this.password,
          name: `${this.form.firstName}`
        }

        const res = await fetch(
          `/auth/local/register?challenge=${this.challenge}${
            this.token ? '&token=' + this.token : ''
          }`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            redirect: 'follow', // obvs not working
            body: JSON.stringify(user)
          }
        )

        if (res.redirected) {
          processSuccessfulAuth(res)
          this.loading = false
          return
        }

        const data = await res.json()
        if (data.err) throw new Error(data.err)
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
