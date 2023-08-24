<template>
  <div>
    <v-dialog
      v-model="realVisible"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-email</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>{{ title }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="realVisible = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-alert v-model="showError" dismissible type="error">
          {{ error }}
        </v-alert>
        <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="sendInvite">
          <v-card-text class="pb-0 mb-4">
            <template v-if="isServerInvite">
              Speckle will send a server invite link to the email below. You can also
              add a personal message if you want to.
            </template>
            <template v-else>
              We will send an invite to the user below - once they accept, they will
              also gain access to this stream!
            </template>
          </v-card-text>
          <v-card-text class="pt-0 mt-0">
            <basic-user-info-row
              v-if="user"
              :user="user"
              :inactive="true"
              class="mb-4"
            />
            <v-text-field
              v-else
              v-model="localEmail"
              :rules="validation.emailRules"
              :disabled="loading"
              label="email"
            ></v-text-field>
            <v-textarea
              v-model="message"
              :rules="validation.messageRules"
              :auto-grow="true"
              :rows="1"
              :disabled="loading"
              label="message"
            />
            <user-role-select
              v-if="allowServerRoleSelect && !user"
              class="mb-4"
              label="Select server role"
              for-invite
              :allow-admin="isAdmin"
              :allow-guest="isGuestMode"
              :role.sync="role"
            />
            <v-card-actions>
              <v-btn block color="primary" type="submit" :disabled="loading">
                Send invite
              </v-btn>
            </v-card-actions>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import { gql } from '@apollo/client/core'
import { PropType, defineComponent } from 'vue'
import { email, maxLength, noXss, required } from '@/main/lib/common/vuetify/validators'
import { Nullable, Optional } from '@/helpers/typeHelpers'
import { VFormInstance } from '@/helpers/vuetifyHelpers'
import type { Get } from 'type-fest'
import type { FetchResult } from '@apollo/client/core'
import { UserSearchQuery } from '@/graphql/generated/graphql'
import BasicUserInfoRow from '@/main/components/user/BasicUserInfoRow.vue'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { useActiveUser } from '@/main/lib/core/composables/activeUser'
import UserRoleSelect from '@/main/components/common/UserRoleSelect.vue'
import { useServerInfo } from '@/main/lib/core/composables/server'
import { Roles } from '@speckle/shared'

type UserType = Get<UserSearchQuery, 'userSearch.items.0'>

export default defineComponent({
  name: 'InviteDialog',
  components: {
    BasicUserInfoRow,
    UserRoleSelect
  },
  props: {
    streamId: {
      type: String,
      default: null
    },
    email: {
      type: String as PropType<Nullable<string>>,
      default: null
    },
    user: {
      type: Object as PropType<UserType>,
      default: null
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { isAdmin } = useActiveUser()
    const { isGuestMode } = useServerInfo()
    return { isAdmin, isGuestMode }
  },
  data() {
    return {
      localEmail: null as Nullable<string>,
      message: 'Hey, I want to share this stream with you!',
      valid: false,
      error: null as Nullable<string>,
      showError: false,
      loading: false,
      role: Roles.Server.User,
      validation: {
        emailRules: [required(), email()],
        messageRules: [
          maxLength(1024, "Message can't be longer than 1024 characters"),
          noXss()
        ]
      }
    }
  },
  computed: {
    allowServerRoleSelect() {
      return this.isAdmin || this.isGuestMode
    },
    isServerInvite(): boolean {
      return !this.streamId
    },
    title(): string {
      return this.isServerInvite ? 'Invite Colleagues' : 'Invite to Stream'
    },
    realVisible: {
      get(): boolean {
        return this.visible
      },
      set(val: boolean): void {
        this.$emit('update:visible', val)
      }
    }
  },
  watch: {
    visible() {
      this.resetForm()
    }
  },
  methods: {
    formRef(): Optional<VFormInstance> {
      return this.$refs.form as Optional<VFormInstance>
    },
    resetForm() {
      this.clear()
      this.localEmail = this.email
      this.message = `Hey, I want to share a stream on Speckle with you!`
    },
    clear() {
      this.error = null
      this.showError = false

      const form = this.formRef()
      if (form) form.resetValidation()
    },
    async sendStreamInvite() {
      return await this.$apollo.mutate({
        mutation: gql`
          mutation ($input: StreamInviteCreateInput!) {
            streamInviteCreate(input: $input)
          }
        `,
        variables: {
          input: {
            email: this.user ? null : this.localEmail,
            message: this.message,
            streamId: this.streamId,
            userId: this.user ? this.user.id : null,
            serverRole: this.allowServerRoleSelect && this.role ? this.role : null
          }
        }
      })
    },
    async sendServerInvite() {
      return await this.$apollo.mutate({
        mutation: gql`
          mutation ($input: ServerInviteCreateInput!) {
            serverInviteCreate(input: $input)
          }
        `,
        variables: {
          input: {
            email: this.localEmail,
            message: this.message,
            serverRole: this.isAdmin ? this.role : null
          }
        }
      })
    },
    async sendInvite() {
      const form = this.formRef()
      if (!form || !form.validate()) return

      this.$mixpanel.track('Invite Send', {
        type: 'action',
        source: this.isServerInvite ? 'server' : 'stream'
      })

      this.loading = true
      try {
        let results: FetchResult
        if (this.isServerInvite) {
          results = await this.sendServerInvite()
        } else {
          results = await this.sendStreamInvite()
        }

        if (results.errors?.length) {
          const firstErr = results.errors[0]
          throw new Error(firstErr.message)
        }

        this.$eventHub.$emit('notification', {
          text: 'Great! An invite link has been sent.',
          type: 'success'
        })
        this.realVisible = false
        this.$emit('invite-sent', { isServerInvite: this.isServerInvite })
        this.$eventHub.$emit(StreamEvents.RefetchCollaborators)
      } catch (e: unknown) {
        this.clear()
        this.showError = true
        this.error = e instanceof Error ? e.message : `${e}`
      } finally {
        this.loading = false
      }
    }
  }
})
</script>
