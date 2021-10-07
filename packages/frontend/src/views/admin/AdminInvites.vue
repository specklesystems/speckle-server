<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title>Send invites to multiple adresses</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-alert v-model="success" prominent timeout="3000" dismissible type="success">
        Great! All invites were sent.
      </v-alert>
      <v-alert v-model="showError" prominent dismissible type="error">
        <p>Invite send failed for adresses:</p>
        <ul>
          <li v-for="error in errors" :key="error.email">{{ error.email }}: {{ error.reason }}</li>
        </ul>
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
          placeholder="Type emails separated by commas or paste the content of a .csv"
          deletable-chips
          append-icon=""
          filled
          rounded
          flat
          type="email"
          class="lighten-2"
          :rules="validation.emailRules"
          multiple
          @change="sanitize"
        >
          <template #selection="data">
            <v-chip :input-value="data.selected" close @click:close="remove(data.item)">
              {{ data.item }}
            </v-chip>
          </template>
        </v-combobox>
        <v-text v-if="!selectedStream">Optionaly invite users to stream.</v-text>
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
export default {
  components: { StreamSearchBar },
  data() {
    return {
      valid: false,
      success: false,
      showError: false,
      errors: [],
      submitting: false,
      invitation: '',
      chips: [],
      selectedStream: null,
      validation: {
        emailRules: [
          (v) => v.length > 0 || 'E-mail is required',
          (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
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
  computed: {
    submitable() {
      return this.valid && this.chips
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
    sanitize() {
      let splitInputs = []
      this.chips.forEach((input) => {
        // first replace supports csv comma and spaces, second repalce for space separated values
        splitInputs.push(...input.replace(', ', ',').replace(/\s+/g, ',').split(','))
      })
      this.chips = [...splitInputs]
    },
    createInviteMessage() {
      let message =
        `You have been invited to a Speckle server: ${this.serverInfo.name} ` +
        `by ${this.user.name}. Visit ${this.serverInfo.canonicalUrl} to register.`
      return this.invitation || message
    },
    async submit() {
      this.submitting = true
      let results = await Promise.all(
        this.chips.map((chip) =>
          this.sendInvite(chip, this.createInviteMessage(), this.selectedStream?.id)
        )
      )
      this.submitting = false
      let errors = results.filter(Boolean)
      console.log(errors)
      if (errors.length) {
        this.errors = errors
        this.showError = true
      } else {
        this.success = true
      }
    },
    async sendInvite(email, message, streamId) {
      let input = {
        email: email,
        message: message
      }
      let query
      if (streamId) {
        input.streamId = streamId
        console.log(input)
        query = gql`
          mutation ($input: StreamInviteCreateInput!) {
            streamInviteCreate(input: $input)
          }
        `
      } else {
        query = gql`
          mutation ($input: ServerInviteCreateInput!) {
            serverInviteCreate(input: $input)
          }
        `
      }
      return await this.$apollo
        .mutate({
          mutation: query,
          variables: {
            input: input
          }
        })
        .then(() => {
          this.$matomo && this.$matomo.trackEvent('invite', 'server')
          return null
        })
        .catch((error) => {
          return {
            email: email,
            reason: error.graphQLErrors.map((gqlError) => gqlError.message).join(', ')
          }
        })
    }
  }
}
</script>
