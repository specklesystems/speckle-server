<template>
  <div>
    <no-data-placeholder
      v-if="
        !$apollo.loading &&
        webhooks.length === 0 &&
        stream &&
        stream.role === 'stream:owner'
      "
      :show-message="false"
    >
      <h2>This stream has no webhooks.</h2>
      <p class="caption">
        Webhooks allow you to subscribe to a stream's events and get notified of them in
        real time. You can then use this to trigger ci apps, automation workflows, and
        more.
      </p>
      <template #actions>
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

    <error-placeholder v-if="error" error-type="access">
      <h2>Only stream owners can access webhooks.</h2>
      <p class="caption">
        If you need to use webhooks, ask the stream's owner to grant you ownership.
      </p>
    </error-placeholder>

    <v-container v-if="showToolbar && canRenderToolbarPortal" fluid class="pa-0">
      <portal to="toolbar">
        <div class="d-flex align-center">
          <div class="text-truncate">
            <router-link
              v-tooltip="stream.name"
              class="text-decoration-none space-grotesk mx-1"
              :to="`/streams/${stream.id}`"
            >
              <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
              <b>{{ stream.name }}</b>
            </router-link>
          </div>
          <div class="text-truncate flex-shrink-0">
            /
            <v-icon small class="mr-2 mb-1 hidden-xs-only">mdi-webhook</v-icon>
            <span class="space-grotesk">Webhooks</span>
          </div>
        </div>
      </portal>
      <v-row>
        <v-col cols="12" sm="12">
          <section-card>
            <!-- <template slot="header">
          <v-icon class="mr-2" small>mdi-webhook</v-icon>
          <span class="d-inline-block">What are Webhooks?</span>
        </template> -->
            <v-card-text>
              Webhooks allow you to subscribe to a stream's events and get notified of
              them in real time. You can then use this to trigger ci apps, automation
              workflows, and more. Read more on webhooks
              <a href="https://speckle.guide/dev/server-webhooks.html" target="_blank">
                here
              </a>
              .
            </v-card-text>
          </section-card>
        </v-col>
        <v-col cols="12" sm="12">
          <section-card>
            <template slot="header">Existing Webhooks</template>
            <template slot="actions">
              <v-spacer></v-spacer>
              <v-btn small class="primary" dark @click="newWebhookDialog = true">
                New Webhook
              </v-btn>
            </template>
            <v-list subheader class="transparent pa-0 ma-0">
              <v-list-item
                v-for="wh in webhooks"
                :key="wh.id"
                link
                style="cursor: default"
              >
                <v-list-item-icon>
                  <v-icon :color="getStatusIcon(wh).color" class="pt-2">
                    {{ getStatusIcon(wh).icon }}
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
                    v-tooltip="'View status reports'"
                    icon
                    @click="
                      selectedWebhook = wh
                      statusReportsDialog = true
                    "
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
          </section-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog
      v-model="newWebhookDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
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

    <v-dialog
      v-model="editWebhookDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
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

    <v-dialog
      v-model="statusReportsDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
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
          <v-list-item
            v-for="(sr, index) in selectedWebhook.history.items"
            :key="index"
          >
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
import {
  claimPortal,
  unclaimPortal,
  STANDARD_PORTAL_KEYS,
  canRenderPortalSource
} from '@/main/utils/portalStateManager'

export default {
  name: 'TheWebhooks',
  components: {
    WebhookForm: () => import('@/main/components/stream/WebhookForm'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder'),
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder'),
    SectionCard: () => import('@/main/components/common/SectionCard')
  },
  apollo: {
    stream: {
      query: webhooksQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId
        }
      },
      error(err) {
        if (err.message) this.error = err.message.replace('GraphQL error: ', '')
        else this.error = err
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
      selectedWebhook: null,
      error: null,
      portalIdentity: 'stream-webhooks'
    }
  },
  computed: {
    webhooks() {
      if (this.stream) return this.stream.webhooks.items
      return []
    },
    showToolbar() {
      return !this.$apollo.loading && this.webhooks.length !== 0
    },
    canRenderToolbarPortal() {
      return canRenderPortalSource(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity)
    }
  },
  watch: {
    showToolbar: {
      handler(newVal) {
        if (newVal) {
          claimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity, 1)
        } else {
          unclaimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity, 1)
        }
      },
      immediate: true
    }
  },
  beforeDestroy() {
    unclaimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity, 1)
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
      const msg = webhook.history.items[0].statusInfo

      return msg
    },
    refetchWebhooks() {
      this.$apollo.queries.stream.refetch()
    }
  }
}
</script>
