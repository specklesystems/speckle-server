<template>
  <v-row>
    <v-col>
      <breadcrumb-title />
      <h3 class="title font-italic font-weight-thin my-5">
        Automate anything by adding webhooks to Stream events
      </h3>
      <admin-card v-if="selectedWebhook != undefined" :loading="loading" title="Edit Webhook">
        <template #subtitle>
          <v-icon dense class="text-subtitle-1 pr-1">mdi-webhook</v-icon>
          <code>{{ selectedWebhook.id }}</code>
        </template>
        <webhook-form
          :loading.sync="loading"
          :stream-id="$attrs.streamId"
          :webhook-id="selectedWebhook.id"
          @refetch-webhooks="refetchWebhooks"
        />
      </admin-card>

      <admin-card
        v-else-if="$route.name === 'add webhook'"
        :loading="loading"
        title="Add Webhook"
        icon="mdi-webhook"
      >
        <webhook-form
          :loading.sync="loading"
          :stream-id="$attrs.streamId"
          @refetch-webhooks="refetchWebhooks"
        />
      </admin-card>

      <admin-card v-else title="Webhooks" icon="mdi-webhook">
        <template #menu>
          <v-btn
            color="primary"
            dark
            class="ma-2"
            small
            :to="`/streams/${$attrs.streamId}/webhooks/new`"
          >
            Add Webhook
          </v-btn>
        </template>

        <v-card-text v-if="webhooks && webhooks.length == 0">
          There are no webhooks on this stream yet.
          <v-btn
            text
            small
            color="primary"
            href="https://speckle.guide/dev/server-webhooks.html"
            target="_blank"
          >
            Read the docs
          </v-btn>
        </v-card-text>

        <v-list subheader two-line>
          <v-list-item
            v-for="wh in webhooks"
            :key="wh.id"
            :to="`/settings/streams/${$attrs.streamId}/webhooks/edit/${wh.id}`"
          >
            <v-list-item-content>
              <v-list-item-title>
                <v-tooltip left>
                  <template #activator="{ on }" class="ml-1">
                    <v-icon class="pb-2 pr-1" small :color="wh.statusIcon.color" v-on="on">
                      {{ wh.statusIcon.icon }}
                    </v-icon>
                  </template>
                  <span>{{ getStatusInfo(wh) }}</span>
                </v-tooltip>
                <span id="description">
                  {{ wh.description ? wh.description : `webhook ${wh.id}` }}
                </span>
              </v-list-item-title>
              <v-list-item-subtitle>{{ wh.url }}</v-list-item-subtitle>
              <v-list-item-subtitle>{{ `( ${wh.triggers.join(', ')} )` }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </admin-card>
    </v-col>
  </v-row>
</template>

<script>
import webhooksQuery from '@/graphql/webhooks.gql'
export default {
  name: 'Webhooks',
  components: {
    AdminCard: () => import('@/components/admin/AdminCard'),
    WebhookForm: () => import('@/components/settings/WebhookForm'),
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle')
  },
  apollo: {
    webhooks: {
      query: webhooksQuery,
      variables() {
        return {
          streamId: this.$attrs.streamId
        }
      },
      update(data) {
        let webhooks = data.stream.webhooks.items
        webhooks.forEach((wh) => {
          wh.statusIcon = this.getStatusIcon(wh)
        })
        return webhooks
      }
    }
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    selectedWebhook() {
      if (this.$apollo.loading || !this.$attrs.webhookId) return

      return this.webhooks.find(({ id }) => id === this.$attrs.webhookId)
    }
  },
  methods: {
    getStatusIcon(webhook) {
      let status = 5 // default 5 if no events
      if (webhook.history.items.length) status = webhook.history.items[0].status
      switch (status) {
        case 0:
        case 1:
          return { color: 'amber', icon: 'mdi-alert-outline' }
        case 2:
          return { color: 'green', icon: 'mdi-check' }
        case 3:
          return { color: 'red', icon: 'mdi-close' }

        default:
          return { color: 'blue-grey', icon: 'mdi-alert-circle-outline' }
      }
    },
    getStatusInfo(webhook) {
      if (!webhook.history.items.length) return 'No events yet'
      let msg = webhook.history.items[0].statusInfo

      return msg
    },
    refetchWebhooks() {
      this.$apollo.queries.webhooks.refetch()
    }
  }
}
</script>

<style>
#description {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 300px;
  display: inline-block;
}
</style>
