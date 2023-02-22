<template>
  <v-card class="elevation-20" rounded="lg">
    <v-card-title v-if="!success" class="justify-center pt-5 pb-2 mb-10">
      One step closer to resetting your password.
    </v-card-title>
    <v-alert v-model="errors" type="error" :icon="null" text multi-line dismissible>
      {{ errorMessage }}
    </v-alert>
    <v-alert v-model="success" :icon="null" text>
      <v-row align="center">
        <v-col class="grow">Done! You can now log in with your new password.</v-col>
        <v-col class="shrink">
          <v-btn color="primary" to="/authn/login">Login</v-btn>
        </v-col>
      </v-row>
    </v-alert>
    <v-card-text v-if="!success">
      <v-form ref="form" class="px-0" @submit.prevent="resetPassword()">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              id="new-password"
              v-model="password"
              label="new password"
              type="password"
              autocomplete="new-password"
              :rules="validation.passwordRules"
              :readonly="loading"
              filled
              single-line
              style="margin-top: -12px"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="passwordConfirmation"
              label="confirm new password"
              type="password"
              :rules="validation.passwordRules"
              :readonly="loading"
              filled
              single-line
              style="margin-top: -12px"
            />
          </v-col>
          <v-col cols="12" class="py-2" style="margin-top: -18px">
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
                    passwordStrength >= 75
                      ? 'green'
                      : passwordStrength >= 50
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
              type="submit"
              block
              large
              color="primary"
              :disabled="loading"
              @click="resetPassword()"
            >
              Save new password
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import { useValidatablePasswordEntry } from '@/main/lib/auth/composables/useValidatablePasswordEntry'

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
  setup() {
    const validatablePasswordEntry = useValidatablePasswordEntry()
    return {
      ...validatablePasswordEntry
    }
  },
  data() {
    return {
      validation: {
        passwordRules: [(v) => !!v || 'Required']
      },
      tokenId: null,
      errors: false,
      errorMessage: null,
      success: false,
      loading: false
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
  mounted() {
    this.tokenId = this.$route.query.t
  },
  methods: {
    async resetPassword() {
      if (this.loading) return

      try {
        this.success = false
        this.errors = false
        this.errorMessage = null
        const valid = this.$refs.form.validate()
        if (!valid) return
        this.validatePassword()

        this.loading = true
        await this.validatePasswordStrength()

        const res = await fetch(`/auth/pwdreset/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId: this.tokenId, password: this.password })
        })

        if (res.status !== 200) {
          this.errors = true
          this.errorMessage = await res.text()
          return
        }

        this.success = true
      } catch (err) {
        this.errorMessage = err.message
        this.errors = true
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
