<template>
  <v-card class="elevation-20" rounded="lg">
    <v-card-title v-if="!success" class="justify-center pt-5 pb-2">
      Account password reset
    </v-card-title>
    <v-alert v-model="errors" type="error" :icon="null" text multi-line dismissible>
      {{ errorMessage }}
    </v-alert>
    <v-alert v-model="success" :icon="null" text>
      <v-row align="center">
        <v-col class="grow">
          Done! We've sent you instructions on how to reset your password at
          {{ form.email }}.
        </v-col>
      </v-row>
    </v-alert>
    <v-card-text v-if="!success" class="pb-7">
      <p class="body-1">
        Type in the email address you used, so we can verify your account. We will send
        you instructions on how to reset your password.
      </p>
      <v-form ref="form" class="" @submit.prevent="sendResetEmail()">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="form.email"
              label="your email"
              :rules="validation.emailRules"
              filled
              single-line
            />
          </v-col>
          <v-col cols="12">
            <v-btn block large color="primary" @click="sendResetEmail()">
              Send Reset Email
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import { isEmailValid } from '@/plugins/authHelpers'

export default {
  name: 'ResetPasswordRequest',
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
      form: {
        email: null
      },
      validation: {
        emailRules: [
          (v) => !!v || 'E-mail is required',
          (v) => isEmailValid(v) || 'E-mail must be valid'
        ]
      },
      success: false,
      errors: false,
      errorMessage: null
    }
  },
  computed: {
    strategies() {
      return this.serverInfo.authStrategies.filter((s) => s.id !== 'local')
    },
    hasLocalStrategy() {
      return this.serverInfo.authStrategies.findIndex((s) => s.id === 'local') !== -1
    }
  },
  mounted() {},
  methods: {
    async sendResetEmail() {
      this.success = false
      this.errors = false
      this.errorMessage = null
      const valid = this.$refs.form.validate()
      if (!valid) return
      const res = await fetch(`/auth/pwdreset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.form.email })
      })

      if (res.status !== 200) {
        this.errors = true
        this.errorMessage = await res.text()
        return
      }

      this.success = true
    }
  }
}
</script>
