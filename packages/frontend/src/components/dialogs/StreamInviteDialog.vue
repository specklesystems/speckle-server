<template>
  <div>
    <v-dialog v-model="showDialog" max-width="400">
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-email</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Send Invites!</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-alert v-model="showError" dismissible type="error" :class="`${success ? 'mb-0' : ''}`">
          {{ error }}
        </v-alert>
        <v-alert v-model="success" dismissible type="success">
          Great! An invite link has been sent.
        </v-alert>
        <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="sendInvite">
          <v-card-text class="pb-0 mb-0">
            We will send an invite to the email below - once they accept, they will also gain access to this stream!
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
            <v-card-actions>
              <v-btn block color="primary" type="submit">Send invite</v-btn>
            </v-card-actions>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import DOMPurify from 'dompurify'
import { isEmailValid } from '@/auth-helpers'

export default {
  name: 'StreamInviteDialog',
  props: {
    streamId: {
      type: String,
      default: null
    },
    streamName: {
      type: String,
      default: null
    },
    text: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      showDialog: false,
      email: null,
      message: 'Hey, I want to share this stream with you!',
      valid: false,
      error: null,
      showError: false,
      success: false,
      validation: {
        emailRules: [
          (v) => !!v || 'E-mail is required',
          (v) => isEmailValid(v) || 'E-mail must be valid'
        ],
        messageRules: [
          (v) => {
            if (v.length >= 1024) return 'Message too long!'
            return true
          },
          (v) => {
            let pure = DOMPurify.sanitize(v)
            if (pure !== v) return 'No crazy hacks please.'
            else return true
          }
        ]
      }
    }
  },
  watch: {
    showDialog() {
      this.clear()
      this.email = this.text
      this.message = `Hey, I want to share a stream (${this.streamName}) with you!`
    }
  },
  methods: {
    show() {
      this.showDialog = true
    },
    clear() {
      this.error = null
      this.showError = false
      this.success = false
      if (this.$refs.form) this.$refs.form.resetValidation()
    },
    async sendInvite() {
      if (!this.$refs.form.validate()) return

      this.$matomo && this.$matomo.trackPageView('invite/stream/create')
      this.$matomo && this.$matomo.trackEvent('invite', 'stream')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation($input: StreamInviteCreateInput!) {
              streamInviteCreate(input: $input)
            }
          `,
          variables: {
            input: {
              email: this.email,
              message: this.message,
              streamId: this.streamId
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
