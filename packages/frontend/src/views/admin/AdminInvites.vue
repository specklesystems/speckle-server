<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title>Send invites to multiple adresses</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-alert v-model="success" prominent timeout="3000" dismissible type="success">
        Great! All invites were sent.
      </v-alert>
      <v-alert v-show="errors.length !== 0" prominent dismissible type="error">
        <p>Invite send failed for adresses:</p>
        <ul>
          <li v-for="error in errors" :key="error.email">{{ error.email }}: {{ error.reason }}</li>
        </ul>
      </v-alert>
      <v-alert
        v-show="errors.length !== 0 && sentToEmails.length !== 0"
        prominent
        timeout="3000"
        dismissible
        type="success"
      >
        <p>Invite sent to: {{ sentToEmails.join(', ') }}</p>
      </v-alert>
      <v-form v-model="valid" @submit.prevent="submit">
        <v-textarea
          v-model="invitation"
          label="Invitation message"
          rounded
          filled
          auto-grow
          :rules="validation.messageRules"
        ></v-textarea>
        <v-combobox
          v-model="chips"
          :search-input.sync="emails"
          placeholder="Type emails separated by commas or paste the content of a .csv"
          deletable-chips
          append-icon=""
          filled
          rounded
          flat
          type="email"
          class="lighten-2"
          :error-messages="inputErrors"
          multiple
          append-outer-icon="mdi-close"
          @keydown="keyDownHandler"
          @blur="validateAndCreateChips"
          @paste="validateAndCreateChips"
          @click:append-outer="chips = []"
        >
          <template #selection="data">
            <v-chip
              v-if="data.item"
              :input-value="data.selected"
              close
              @click:close="remove(data.item)"
            >
              {{ data.item }}
            </v-chip>
          </template>
        </v-combobox>
        <p v-if="!selectedStream">Optionaly invite users to stream.</p>
        <stream-search-bar
          v-if="!selectedStream"
          :gotostreamonclick="false"
          class="py-3"
          @select="setStream"
        />
        <v-alert v-else text dense type="info" dismissible @input="dismiss">
          They will be invited to be collaborators on {{ selectedStream.name }} stream.
        </v-alert>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :disabled="!submitable" color="primary" type="submit">Invite</v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
    <v-overlay absolute :value="submitting">
      <v-progress-circular :width="1.5" indeterminate></v-progress-circular>
    </v-overlay>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import DOMPurify from 'dompurify'
import StreamSearchBar from '@/components/SearchBar'
import { isEmailValid } from '@/auth-helpers'

export default {
  name: 'AdminInvites',
  components: { StreamSearchBar },
  data() {
    return {
      valid: false,
      success: false,
      showError: false,
      errors: [],
      sentToEmails: [],
      submitting: false,
      invitation: '',
      emails: '',
      chips: [],
      inputErrors: [],
      selectedStream: null,
      validation: {
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
  computed: {
    submitable() {
      return this.chips && this.chips.length !== 0
    }
  },
  apollo: {
    user: {
      query: gql`
        query {
          user {
            id
            name
          }
        }
      `,
      prefetch: true
    },
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            canonicalUrl
          }
        }
      `
    }
  },
  methods: {
    setStream(stream) {
      this.selectedStream = stream
    },
    dismiss() {
      this.selectedStream = null
    },
    remove(item) {
      this.chips.splice(this.chips.indexOf(item), 1)
    },
    keyDownHandler(val) {
      if (!(val.key === ' ' || val.key === ',' || val.key === 'Enter')) return
      this.validateAndCreateChips()
    },
    validateAndCreateChips() {
      this.inputErrors = []
      if (!this.emails || this.emails === '') return
      let splitEmails = this.emails.split(/[ ,]+/)
      for (let email of splitEmails) {
        let valid = isEmailValid(email) && this.chips.indexOf(email) === -1
        if (valid) {
          this.chips.push(email)
        } else {
          this.inputErrors.push('Invalid email')
        }
      }
      this.emails = ''
    },
    createInviteMessage() {
      let message =
        `You have been invited to a Speckle server: ${this.serverInfo.name} ` +
        `by ${this.user.name}. Visit ${this.serverInfo.canonicalUrl} to register.`
      return this.invitation || message
    },
    async submit() {
      this.submitting = true
      this.errors = []
      this.sentToEmails = []
      for (let chip of this.chips) {
        if (!chip || chip.length === 0) continue
        try {
          await this.sendInvite(chip, this.createInviteMessage(), this.selectedStream?.id)
          this.sentToEmails.push(chip)
        } catch (err) {
          this.errors.push({ email: chip, reason: err.graphQLErrors[0].message })
        }
      }

      this.submitting = false
      if (this.errors.length === 0) {
        this.success = true
        this.chips = []
        this.dismiss()
      }
    },
    async sendInvite(email, message, streamId) {
      let input = {
        email: email,
        message: message
      }

      let query = gql`
        mutation($input: ${streamId ? 'StreamInviteCreateInput!' : 'ServerInviteCreateInput!'}) {
          ${streamId ? 'streamInviteCreate' : 'serverInviteCreate'}(input: $input)
        }
      `
      if (streamId) {
        input.streamId = streamId
      }

      await this.$apollo.mutate({
        mutation: query,
        variables: {
          input: input
        }
      })

      this.$matomo && this.$matomo.trackEvent('invite', 'server')
    }
  }
}
</script>
