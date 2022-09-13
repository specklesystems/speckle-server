<template>
  <div>
    <no-data-placeholder
      v-if="
        !$apollo.loading &&
        functions.length === 0 &&
        stream &&
        stream.role === 'stream:owner'
      "
      :show-message="false"
    >
      <h2>This stream has no functions.</h2>
      <p class="caption">Functions allow you to so stuff.</p>
      <template #actions>
        <v-list rounded class="transparent">
          <v-list-item link class="primary mb-4" dark @click="newFunctionDialog = true">
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Create Function</v-list-item-title>
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
              <v-list-item-title>Function docs</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Read the documentation on webhooks.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </no-data-placeholder>

    <!-- <error-placeholder v-if="error" error-type="access">
      <h2>Only stream owners can access webhooks.</h2>
      <p class="caption">
        If you need to use webhooks, ask the stream's owner to grant you ownership.
      </p>
    </error-placeholder> -->

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
            <span class="space-grotesk">Functions</span>
          </div>
        </div>
      </portal>
      <v-row>
        <v-col cols="12" sm="12">
          <section-card>
            <template slot="header">
              <v-icon class="mr-2" small>mdi-webhook</v-icon>
              <span class="d-inline-block">What are Functions?</span>
            </template>
            <v-card-text>They are things that do stuff.</v-card-text>
          </section-card>
        </v-col>
        <v-col cols="12" sm="12">
          <section-card>
            <template slot="header">Existing Functions</template>
            <template slot="actions">
              <v-spacer></v-spacer>
              <v-btn small class="primary" dark @click="newFunctionDialog = true">
                New Function
              </v-btn>
            </template>
            <v-list subheader class="transparent pa-0 ma-0">
              <v-list-item
                v-for="wh in functions"
                :key="wh.id"
                link
                style="cursor: default"
              >
                <v-list-item-icon>
                  <!-- <v-icon :color="getStatusIcon(wh).color" class="pt-2">
                    {{ getStatusIcon(wh).icon }}
                  </v-icon> -->
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ wh ? wh : `Webhook ${wh}` }}
                  </v-list-item-title>
                </v-list-item-content>
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
            <v-card-text v-if="functions && functions.length == 0">
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
      v-model="newFunctionDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
      <v-card>
        <v-toolbar>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-plus-box</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Create Function</v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn icon @click="newFunctionDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <function-form
          :loading.sync="loading"
          :stream-id="$attrs.streamId"
          @close="newFunctionDialog = false"
        />
      </v-card>
    </v-dialog>

    <!-- <v-dialog
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
        <function-form
          v-if="selectedWebhook"
          :loading.sync="loading"
          :stream-id="$attrs.streamId"
          :webhook-id="selectedWebhook.id"
          @refetch-webhooks="refetchWebhooks"
          @close="editWebhookDialog = false"
        />
      </v-card>
    </v-dialog> -->

    <!-- <v-dialog
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
    </v-dialog> -->
  </div>
</template>

<script>
import { functionsQuery } from '@/graphql/functions.js'
import {
  claimPortal,
  unclaimPortal,
  STANDARD_PORTAL_KEYS,
  canRenderPortalSource
} from '@/main/utils/portalStateManager'

export default {
  name: 'TheWebhooks',
  components: {
    FunctionForm: () => import('@/main/components/stream/FunctionForm'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder'),
    // ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder'),
    SectionCard: () => import('@/main/components/common/SectionCard')
  },
  apollo: {
    stream: {
      query: functionsQuery,
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
      newFunctionDialog: false,
      editWebhookDialog: false,
      statusReportsDialog: false,
      selectedWebhook: null,
      error: null,
      portalIdentity: 'stream-webhooks'
    }
  },
  computed: {
    functions() {
      console.log(this.stream)
      return this.stream?.functions || []
    },
    showToolbar() {
      return !this.$apollo.loading && this.functions.length !== 0
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
