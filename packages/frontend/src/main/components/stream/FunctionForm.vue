<template>
  <v-container>
    <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="sendInvite">
      <v-text-field
        v-model="functionName"
        :rules="validation.descriptionRules"
        label="Function Name"
        hint="A POST request will be sent to this URL when this webhook is triggered"
      />
    </v-form>

    <v-divider class="mt-4 mb-3" />

    <v-card-actions v-if="webhook != null">
      <v-spacer></v-spacer>
      <v-btn color="error" text @click="showDelete = true">Delete Webhook</v-btn>
      <v-btn color="primary" type="submit" :disabled="!valid" @click="saveChanges">
        Save Changes
      </v-btn>
      <v-dialog v-model="showDelete" max-width="500">
        <v-card>
          <v-card-title>Are you sure?</v-card-title>
          <v-card-text>
            You cannot undo this action. This webhook will be permanently deleted.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showDelete = false">Cancel</v-btn>
            <v-btn color="error" text @click="deleteWebhook">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-actions>
    <v-card-actions v-else>
      <v-spacer></v-spacer>
      <input ref="file" type="file" style="display: none" />
      <v-btn color="link" type="submit" @click="addFunction">Or Upload Files</v-btn>
      <v-btn color="primary" type="submit" :disabled="!valid" @click="addFunction">
        Add Function
      </v-btn>
    </v-card-actions>
  </v-container>
</template>

<script>
import { gql } from '@apollo/client/core'
import webhookQuery from '@/graphql/webhook.gql'

export default {
  name: 'FunctionForm',
  props: {
    webhookId: {
      type: String,
      default: null
    },
    streamId: {
      type: String,
      default: null
    }
  },
  apollo: {
    webhook: {
      query: webhookQuery,
      variables() {
        return {
          streamId: this.streamId,
          webhookId: this.webhookId
        }
      },
      update(data) {
        const webhook = data.stream.webhooks.items[0]
        this.secret = null
        if (webhook)
          ({
            url: this.url,
            description: this.description,
            triggers: this.triggers,
            enabled: this.enabled
          } = webhook)

        return webhook
      },
      skip() {
        return !this.webhookId
      }
    }
  },
  data: () => ({
    functionName: '',
    functions: [],
    showDelete: false,
    valid: false,
    url: null,
    description: null,
    triggers: [],
    secret: null,
    enabled: true,
    allTriggers: [
      'stream_update',
      'stream_delete',
      'branch_create',
      'branch_update',
      'branch_delete',
      'commit_create',
      'commit_update',
      'commit_receive',
      'commit_delete',
      'comment_created',
      'comment_archived',
      'comment_replied',
      'stream_permissions_add',
      'stream_permissions_remove'
    ],
    validation: {
      urlRules: [
        (v) => !!v || 'URL is required',
        (v) => (/^https?:\/\//.test(v) ? true : `That doesn't look like a valid url`)
      ],
      descriptionRules: [
        (v) => {
          if (v?.length >= 1024) return 'Description too long!'
          return true
        }
      ],
      secretRules: [
        (v) => {
          if (v?.length >= 100) return 'Secret should be less than 100 characters'
          return true
        }
      ],
      triggersRules: [
        (v) => {
          if (!v || v.length === 0) return 'You must select at least one trigger'
          return true
        }
      ]
    }
  }),
  methods: {
    // async saveChanges() {
    //   this.$emit('update:loading', true)
    //   this.$mixpanel.track('Webhook Action', { type: 'action', name: 'update' })

    //   const params = {
    //     id: this.webhook.id,
    //     streamId: this.streamId,
    //     url: this.url,
    //     description: this.description,
    //     triggers: this.triggers,
    //     enabled: this.enabled
    //   }
    //   if (this.secret) params.secret = this.secret

    //   await this.$apollo.mutate({
    //     mutation: gql`
    //       mutation webhookUpdate($params: WebhookUpdateInput!) {
    //         addFunction(webhook: $params)
    //       }
    //     `,
    //     variables: {
    //       params
    //     }
    //   })
    //   this.$emit('refetch-webhooks')
    //   this.$emit('update:loading', false)
    //   this.$emit('close')
    // },
    async addFunction() {
      this.$emit('update:loading', true)

      console.log(this.functions)

      this.url = 'gateway.openfaas.svc.cluster.local/function/' + this.functionName

      await this.$apollo.mutate({
        mutation: gql`
          mutation functionCreate($streamId: String!, $url: String!) {
            addFunction(streamId: $streamId, url: $url)
          }
        `,
        variables: {
          streamId: this.streamId,
          url: this.url
        }
      })

      // this.$emit('refetch-webhooks')
      this.$emit('update:loading', false)
      this.$emit('close')
    },
    async deleteWebhook() {
      this.$emit('update:loading', true)
      this.$mixpanel.track('Webhook Action', { type: 'action', name: 'delete' })

      await this.$apollo.mutate({
        mutation: gql`
          mutation webhookDelete($params: WebhookDeleteInput!) {
            webhookDelete(webhook: $params)
          }
        `,
        variables: {
          params: { id: this.webhookId, streamId: this.streamId }
        }
      })

      this.$emit('refetch-webhooks')
      this.$emit('update:loading', false)
      this.$emit('close')
    }
  }
}
</script>