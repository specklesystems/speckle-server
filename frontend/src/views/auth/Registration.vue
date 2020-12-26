<template>
  <v-card class="elevation-20" rounded="lg">
    <v-card-title class="justify-center pt-10 pb-2">Interoperability in seconds</v-card-title>
    <strategies :strategies="strategies" :app-id="appId" :challenge="challenge" :suuid="suuid" />
    <v-card-title class="justify-center pb-5 pt-0 body-1 text--secondary">
      <v-divider class="mx-4"></v-divider>
      Create an account
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
      <v-form ref="form" class="px-3">
        <v-row dense>
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
          <v-col cols="12" sm="12">
            <v-text-field
              v-model="form.firstName"
              label="name"
              :rules="validation.nameRules"
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
              filled
              single-line
              style="margin-top: -12px"
              prepend-icon="mdi-office-building"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.password"
              label="password"
              type="password"
              :rules="validation.passwordRules"
              filled
              single-line
              style="margin-top: -12px"
              prepend-icon="mdi-form-textbox-password"
              @keydown="debouncedPwdTest"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.passwordConf"
              label="confirm password"
              type="password"
              :rules="validation.passwordRules"
              filled
              single-line
              style="margin-top: -12px"
            />
          </v-col>
          <v-col cols="12" class="py-2 pl-9" style="margin-top: -18px">
            <v-row v-show="passwordStrength !== 1 && this.form.password" no-gutters align="center">
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
                    passwordStrength >= 75 ? 'green' : passwordStrength >= 50 ? 'orange' : 'red'
                  }`"
                ></v-progress-linear>
              </v-col>
              <v-col cols="12" class="caption text-center mt-3">
                {{
                  this.pwdSuggestions
                    ? this.pwdSuggestions
                    : this.form.password
                    ? 'Looks good.'
                    : null
                }}
                <span v-if="this.form.password !== this.form.passwordConf">
                  <b>Passwords do not match.</b>
                </span>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-btn block large color="primary" @click="registerUser">Create Account</v-btn>
            <p class="text-center"></p>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    <v-card-title class="justify-center caption">
      <div class="mx-4 align-self-center">Already have an account?</div>
      <div class="mx-4 align-self-center">
        <v-btn color="primary" plain text :to="loginRoute">Login</v-btn>
      </div>
    </v-card-title>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import crs from 'crypto-random-string'

import Blurb from '../../components/auth/Blurb'
import Strategies from '../../components/auth/Strategies'

export default {
  name: 'Registration',
  components: { Blurb, Strategies },
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            adminContact
            termsOfService
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
  data() {
    return {
      serverInfo: { authStrategies: [] },
      form: {
        email: null,
        firstName: null,
        lastName: null,
        company: null,
        password: null,
        passwordConf: null
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
          (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
        ]
      },
      passwordStrength: 1,
      pwdSuggestions: null,
      appId: null,
      challenge: null,
      suuid: null
    }
  },
  computed: {
    loginRoute() {
      return {
        name: 'Login',
        query: {
          appId: this.$route.query.appId,
          challenge: this.$route.query.challenge,
          suuid: this.$route.query.suuid
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
    let urlParams = new URLSearchParams(window.location.search)
    let appId = urlParams.get('appId')
    let challenge = urlParams.get('challenge')
    let suuid = urlParams.get('suuid')

    this.suuid = suuid
    console.log(this.suuid)
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
    debouncedPwdTest: debounce(async function () {
      let result = await this.$apollo.query({
        query: gql` query{ userPwdStrength(pwd:"${this.form.password}")}`
      })
      this.passwordStrength = result.data.userPwdStrength.score * 25
      this.pwdSuggestions = result.data.userPwdStrength.feedback.suggestions[0]
    }, 1000),
    async registerUser() {
      try {
        let valid = this.$refs.form.validate()
        if (!valid) return
        if (this.form.password !== this.form.passwordConf) throw new Error('Passwords do not match')
        if (this.passwordStrength < 3) throw new Error('Password too weak')

        let user = {
          email: this.form.email,
          company: this.form.company,
          password: this.form.password,
          name: `${this.form.firstName} ${this.form.lastName}`
        }

        if (this.suuid) user.suuid = this.suuid

        let res = await fetch(
          `/auth/local/register?appId=${this.appId}&challenge=${this.challenge}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            redirect: 'follow', // obvs not working
            body: JSON.stringify(user)
          }
        )

        let data = await res.json()
        if (data.err) throw new Error(data.err)

        if (res.redirected) {
          window.location = res.url
        }
      } catch (err) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  }
}
</script>
