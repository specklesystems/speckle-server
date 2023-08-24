<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">Bulk Invites</portal>
    <section-card>
      <v-card-text>
        <v-alert v-model="success" prominent timeout="3000" dismissible type="success">
          Great! All invites were sent.
        </v-alert>
        <v-alert v-show="errors.length !== 0" prominent dismissible type="error">
          <p>Invite send failed:</p>
          <ul>
            <li v-for="error in errors" :key="error.message">
              {{ error.message }}
            </li>
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
          <user-role-select
            class="mb-4"
            label="Select server role"
            for-invite
            :allow-guest="isGuestMode"
            :role.sync="role"
          />
          <p v-if="!selectedStream">Optionally invite users to stream.</p>
          <stream-search-bar
            v-if="!selectedStream"
            :gotostreamonclick="false"
            class="py-3"
            @select="setStream"
          />
          <v-alert v-else text dense type="info" dismissible @input="dismiss">
            They will be invited to be collaborators on the "{{ selectedStream.name }}"
            stream.
          </v-alert>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn block :disabled="!submitable" color="primary" type="submit">
              Invite
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
      <v-overlay absolute :value="submitting">
        <v-progress-circular :width="1.5" indeterminate></v-progress-circular>
      </v-overlay>
    </section-card>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import { isEmailValid } from '@/plugins/authHelpers'
import { mainServerInfoQuery } from '@/graphql/server'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import { maxLength, noXss } from '@/main/lib/common/vuetify/validators'
import {
  BatchInviteToStreamsDocument,
  BatchInviteToServerDocument
} from '@/graphql/generated/graphql'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { Roles } from '@speckle/shared'
import UserRoleSelect from '@/main/components/common/UserRoleSelect.vue'

export default {
  name: 'AdminInvites',
  components: {
    SectionCard: () => import('@/main/components/common/SectionCard'),
    StreamSearchBar: () => import('@/main/components/common/SearchBar'),
    UserRoleSelect
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'admin-invites', 1)],
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
      role: Roles.Server.User,
      validation: {
        messageRules: [
          maxLength(1024, "Message can't be longer than 1024 characters"),
          noXss()
        ]
      }
    }
  },
  computed: {
    submitable() {
      return this.chips && this.chips.length !== 0
    },
    isGuestMode() {
      return !!this.serverInfo?.guestModeEnabled
    }
  },
  apollo: {
    user: {
      query: gql`
        query {
          activeUser {
            id
            name
          }
        }
      `,
      update: (data) => data.activeUser,
      prefetch: true
    },
    serverInfo: {
      query: mainServerInfoQuery
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
      const splitEmails = this.emails.split(/[ ,]+/)
      for (const email of splitEmails) {
        const valid = isEmailValid(email) && this.chips.indexOf(email) === -1
        if (valid) {
          this.chips.push(email)
        } else {
          this.inputErrors.push('Invalid email')
        }
      }
      this.emails = ''
    },
    createInviteMessage() {
      const message =
        `You have been invited to a Speckle server: ${this.serverInfo.name} ` +
        `by ${this.user.name}. Visit ${this.serverInfo.canonicalUrl} to register.`
      return this.invitation || message
    },
    async submit() {
      this.submitting = true
      this.errors = []
      this.sentToEmails = []

      const targetEmails = this.chips.filter((c) => c.length)
      const streamId = this.selectedStream?.id
      const message = this.createInviteMessage()
      const paramsArray = streamId
        ? targetEmails.map((e) => ({
            email: e,
            streamId,
            message,
            serverRole: this.role
          }))
        : targetEmails.map((e) => ({
            email: e,
            message,
            serverRole: this.role
          }))

      try {
        await this.sendInvites(paramsArray, streamId)
        this.sentToEmails = targetEmails
      } catch (err) {
        this.errors.push(err)
      }

      this.submitting = false
      if (this.errors.length === 0) {
        this.success = true
        this.chips = []
        this.dismiss()
      }
    },
    async sendInvites(paramsArray, streamId) {
      const { data, errors } = streamId
        ? await this.$apollo
            .mutate({
              mutation: BatchInviteToStreamsDocument,
              variables: { paramsArray }
            })
            .catch(convertThrowIntoFetchResult)
        : await this.$apollo
            .mutate({
              mutation: BatchInviteToServerDocument,
              variables: { paramsArray }
            })
            .catch(convertThrowIntoFetchResult)

      if (!data?.serverInviteBatchCreate && !data?.streamInviteBatchCreate) {
        const errMsg =
          errors?.[0].message || 'Invitation processing unexpectedly failed'
        throw new Error(errMsg)
      }

      this.$mixpanel.track('Invite Send', {
        type: 'action',
        source: streamId ? 'stream' : 'server'
      })
    }
  }
}
</script>
