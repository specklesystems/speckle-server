<template>
  <v-card>
    <v-toolbar color="primary" dark flat>
      <v-app-bar-nav-icon style="pointer-events: none">
        <v-icon>mdi-email</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Invite Colleagues!</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-alert
      v-model="showError"
      dismissible
      type="error"
      :class="`${success ? 'mb-0' : ''}`"
    >
      {{ error }}
    </v-alert>
    <v-alert v-model="success" timeout="3000" dismissible type="success">
      Great! An invite link has been sent.
    </v-alert>
    <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="sendInvite">
      <v-card-text class="pb-0 mb-0">
        Speckle will send a server invite link to the email below. You can also add a
        personal message if you want to.
      </v-card-text>
      <v-card-text class="pt-0 mt-0">
        <v-text-field
          v-model="email"
          :rules="validation.emailRules"
          label="email"
        ></v-text-field>
        <v-text-field
          v-model="message"
          :rules="validation.messageRules"
          label="message"
        ></v-text-field>
      </v-card-text>
      <v-card-actions class="pb-3">
        <v-btn block large color="primary" type="submit">Send invite</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import DOMPurify from 'dompurify'
import { email, required } from '@/main/lib/common/vuetify/validators'

export default {
  name: 'ServerInviteDialog',
  data() {
    return {
      showDialog: false,
      email: null,
      message: 'Hey, join this Speckle Server!',
      valid: false,
      error: null,
      showError: false,
      success: false,
      validation: {
        emailRules: [required('E-mail is required'), email('E-mail must be valid')],
        messageRules: [
          (v) => {
            if (v.length >= 1024) return 'Message too long!'
            return true
          },
          (v) => {
            const pure = DOMPurify.sanitize(v)
            if (pure !== v) return 'No crazy hacks please.'
            else return true
          }
        ]
      }
    }
  },
  watch: {},
  methods: {
    clear() {
      this.error = null
      this.showError = false
      this.success = false
      if (this.$refs.form) this.$refs.form.resetValidation()
    },
    async sendInvite() {
      if (!this.$refs.form.validate()) return

      this.$mixpanel.track('Invite Send', { type: 'action', source: 'server' })
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation ($input: ServerInviteCreateInput!) {
              serverInviteCreate(input: $input)
            }
          `,
          variables: {
            input: {
              email: this.email,
              message: this.message
            }
          }
        })

        this.clear()
        this.success = true
      } catch (e) {
        this.clear()
        this.showError = true
        this.error = e.message
      }
    }
  }
}
</script>
