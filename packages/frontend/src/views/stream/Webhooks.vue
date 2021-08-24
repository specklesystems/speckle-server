<template>
  <div>
    <no-data-placeholder :show-message="false" v-if="!$apollo.loading && webhooks.length === 0">
      <h2>This stream has no webhooks.</h2>
      <p class="caption">
        Webhooks allow you to subscribe to a stream's events and get notified of them in real time.
        You can then use this to trigger ci apps, automation workflows, and more.
      </p>
      <template v-slot:actions>
        <v-list rounded class="transparent">
          <v-list-item link class="primary mb-4" dark @click="newWebhookDialog = true">
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Create Webhook</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            link
            :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
            href="https://speckle.guide/dev/server-webhooks.html"
            target="_blank"
          >
            <v-list-item-icon>
              <v-icon>mdi-book-open-variant</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Webhook docs</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Read the documentation on webhooks.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </no-data-placeholder>

    <v-container style="max-width: 768px" v-if="!$apollo.loading && webhooks.length !== 0">
      <portal to="streamTitleBar">
        <div>
          <v-icon small class="mr-2">mdi-webhook</v-icon>
          <span class="space-grotesk">Webhooks</span>
        </div>
      </portal>

      <v-alert
        type="warning"
        v-if="stream && stream.role !== 'stream:contributor' && stream.role !== 'stream:owner'"
      >
        Hai! Your permission level ({{ stream.role }}) is not high enough to edit this stream's
        webhooks.
      </v-alert>

      <v-card
        v-else
        elevation="0"
        rounded="lg"
        :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`"
      >
        <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''}`">
          <v-toolbar-title>
            <v-icon class="mr-2" small>mdi-webhook</v-icon>
            <span class="d-inline-block">What are Webhooks?</span>
          </v-toolbar-title>
        </v-toolbar>
        <v-card-text class="pb-1">
          <p class="caption">
            Webhooks allow you to subscribe to a stream's events and get notified of them in real
            time. You can then use this to trigger ci apps, automation workflows, and more. Read
            more on webhooks
            <a href="https://speckle.guide/dev/server-webhooks.html" target="_blank">here</a>
            .
          </p>
        </v-card-text>
      </v-card>
      <v-card
        elevation="0"
        rounded="lg"
        :loading="loading"
        :class="`mt-2 ${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`"
      >
        <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''}`">
          <v-toolbar-title>
            <v-icon class="mr-2" small>mdi-webhook</v-icon>
            <span class="d-inline-block">Existing Webhooks</span>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn @click="newWebhookDialog = true" small class="primary" dark>
            New Webhook
          </v-btn>
        </v-toolbar>
        <v-list subheader class="transparent pa-0 ma-0" >
          <v-list-item v-for="wh in webhooks" :key="wh.id" link style="cursor: default">
            <v-list-item-icon>
              <v-icon :color="wh.statusIcon.color" class="pt-2">
                {{ wh.statusIcon.icon }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ wh.description ? wh.description : `Webhook ${wh.id}` }}
              </v-list-item-title>
              <v-list-item-subtitle class="caption">
                {{ wh.url }} {{ `(${wh.triggers.join(', ')})` }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="caption">
                {{ getStatusInfo(wh) }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action v-if="wh.history.items.length != 0">
              <v-btn
                @click="
                  selectedWebhook = wh
                  statusReportsDialog = true
                "
                icon
                v-tooltip="'View status reports'"
              >
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <v-btn
                small
                @click="
                  selectedWebhook = wh
                  editWebhookDialog = true
                "
              >
                edit
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card>

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
    </v-container>

    <v-dialog v-model="newWebhookDialog" width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card>
        <v-toolbar>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-plus-box</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Create Webhook</v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn icon @click="newWebhookDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <webhook-form
          :loading.sync="loading"
          :stream-id="$attrs.streamId"
          @refetch-webhooks="refetchWebhooks"
          @close="newWebhookDialog = false"
        />
      </v-card>
    </v-dialog>

    <v-dialog v-model="editWebhookDialog" width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card>
        <v-toolbar>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-pencil</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Edit Webhook</v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn icon @click="editWebhookDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <webhook-form
          v-if="selectedWebhook"
          :loading.sync="loading"
          :stream-id="$attrs.streamId"
          :webhook-id="selectedWebhook.id"
          @refetch-webhooks="refetchWebhooks"
          @close="editWebhookDialog = false"
        />
      </v-card>
    </v-dialog>

    <v-dialog v-model="statusReportsDialog" width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card>
        <v-toolbar>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-information</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Webhook Status Reports</v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn icon @click="statusReportsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>

        <v-list v-if="selectedWebhook">
          <v-subheader>Latest delivery reports:</v-subheader>
          <v-list-item v-for="sr in selectedWebhook.history.items">
            <v-list-item-icon>
              <v-icon :class="`${sr.status === 2 ? 'green--text' : 'red--text'}`">
                {{ sr.status === 2 ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <div>
                {{ sr.statusInfo }}
              </div>
              <v-list-item-subtitle class="caption">
                Last update: {{ sr.lastUpdate }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import webhooksQuery from '@/graphql/webhooks.gql'
export default {
  name: 'Webhooks',
  components: {
    AdminCard: () => import('@/components/admin/AdminCard'),
    WebhookForm: () => import('@/components/settings/WebhookForm'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder')
  },
  apollo: {
    stream: {
      query: webhooksQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId
        }
      },
      update(data) {
        data.stream.webhooks.items.forEach((wh) => {
          wh.statusIcon = this.getStatusIcon(wh)
        })
        return data.stream
      }
    }
  },
  data() {
    return {
      loading: false,
      stream: null,
      newWebhookDialog: false,
      editWebhookDialog: false,
      statusReportsDialog: false,
      selectedWebhook: null
    }
  },
  computed: {
    webhooks() {
      if (this.stream) return this.stream.webhooks.items
      return []
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
      this.$apollo.queries.stream.refetch()
    }
  }
}
</script>
