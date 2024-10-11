<template>
  <v-container>
    <v-row justify="center" style="margin-top: 50px" dense>
      <v-col
        cols="12"
        lg="6"
        md="6"
        xl="6"
        class="d-flex flex-column justify-center align-center"
      >
        <v-card flat tile color="transparent" class="pa-0">
          <div
            v-if="showImage"
            class="d-flex flex-column justify-space-between align-center mb-10"
          >
            <v-img contain max-height="200" src="@/assets/emptybox.png"></v-img>
          </div>
          <div class="text-center mb-2 space-grotesk">
            <slot name="default"></slot>
          </div>
          <v-container style="max-width: 500px">
            <slot name="actions">
              <v-list rounded class="transparent">
                <v-list-item
                  v-if="user && !hasManager"
                  link
                  class="primary mb-4"
                  dark
                  href="https://speckle.systems/download/"
                  target="_blank"
                >
                  <v-list-item-icon>
                    <v-icon class="pt-4">mdi-download</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Install Connectors</v-list-item-title>
                    <p class="caption pb-0 mb-0">
                      Download Speckle Manager to install connectors for your design
                      applications and start sending data in no time!
                    </p>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-if="user && !hasManager"
                  :href="`speckle://accounts?add_server_account=${rootUrl}`"
                  link
                  :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
                >
                  <v-list-item-icon>
                    <v-icon class="pt-4">mdi-account-plus</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Authenticate</v-list-item-title>
                    <p class="caption pb-0 mb-0">
                      Link up your Speckle account with the desktop connectors you have
                      installed.
                    </p>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item
                  v-if="hasManager"
                  link
                  :class="`${hasManager ? 'primary' : ''} mb-4`"
                  dark
                  href="https://v1.speckle.systems/features/connectors"
                  target="_blank"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-swap-horizontal</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Connectors Guides</v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      Learn how to send data from various software.
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item
                  v-if="hasManager"
                  link
                  :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
                  href="https://speckle.systems/tutorials"
                  target="_blank"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-school</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Tutorials</v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      Tips, tricks and how-to guides.
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item
                  v-if="hasManager"
                  link
                  :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
                  href="https://speckle.guide"
                  target="_blank"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-book-open-variant</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Docs</v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      Documentation and training material for all connectors.
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item
                  link
                  :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
                  href="https://speckle.community"
                  target="_blank"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-forum</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Community Forum</v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      Need help? We're here for you!
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </slot>
            <slot name="append"></slot>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { gql } from '@apollo/client/core'
export default {
  props: {
    showImage: {
      type: Boolean,
      default: true
    }
  },
  apollo: {
    user: {
      query: gql`
        query {
          activeUser {
            id
            authorizedApps {
              id
              name
            }
          }
        }
      `,
      update: (data) => data.activeUser
    }
  },
  data() {
    return {}
  },
  computed: {
    rootUrl() {
      return window.location.origin
    },
    hasManager() {
      if (!this.user) return
      return this.user.authorizedApps.filter((app) => app.id === 'sdm').length !== 0
    }
  },
  mounted() {
    this.checkAccountTimer = setInterval(
      function () {
        if (!this.hasManager) this.$apollo.queries.user.refetch()
      }.bind(this),
      3000
    )
  },
  beforeDestroy() {
    clearInterval(this.checkAccountTimer)
  }
}
</script>
