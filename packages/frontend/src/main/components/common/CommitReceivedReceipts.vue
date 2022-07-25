<template>
  <div
    v-if="activity && activity.items.length !== 0"
    v-tooltip="
      `Received ${activity.items.length} times by ${receivedUsersUnique.length} persons. Click to see more.`
    "
    class="d-inline-block"
    @click="showAllActivityDialog = true"
  >
    <div
      style="cursor: pointer; min-height: 33px; line-height: 33px"
      :class="`${$vuetify.theme.dark ? 'black' : 'grey lighten-3'} ${
        shadow ? 'elevation-3' : ''
      } rounded-xl px-2`"
    >
      <v-icon small>mdi-call-received</v-icon>

      <user-avatar
        v-for="userId in receivedUsersUnique.slice(0, 2)"
        :id="userId"
        :key="userId"
        xxxv-show="$vuetify.breakpoint.smAndUp"
        :show-hover="false"
        :size="20"
      ></user-avatar>

      <v-avatar
        v-if="receivedUsersUnique.length > 2"
        xxxv-show="$vuetify.breakpoint.smAndUp"
        class="ml-1"
        size="20"
        color="primary"
      >
        <span class="white--text caption">+{{ receivedUsersUnique.length - 2 }}</span>
      </v-avatar>
      <!-- <v-avatar v-show="$vuetify.breakpoint.xsOnly" class="ml-1" size="25" color="primary">
        <span class="white--text caption">{{ receivedUsersUnique.length }}</span>
      </v-avatar> -->
    </div>
    <v-dialog
      v-model="showAllActivityDialog"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <v-card v-if="activity">
        <v-toolbar>
          <v-app-bar-nav-icon><v-icon>mdi-download</v-icon></v-app-bar-nav-icon>
          <v-toolbar-title>All Received Receipts</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="showAllActivityDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-list>
          <v-list-item v-for="(act, i) in activity.items" :key="i">
            <v-list-item-icon>
              <user-avatar :id="act.userId"></user-avatar>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="captionxxx">
                {{ act.message.split(' was ')[1] }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <timeago :datetime="act.time"></timeago>
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <source-app-avatar
                class="mt-3 mb-3"
                :application-name="act.info.sourceApplication"
              />
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar')
  },
  props: {
    commitId: {
      type: String,
      default: null
    },
    streamId: {
      type: String,
      default: null
    },
    shadow: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return { showAllActivityDialog: false }
  },
  apollo: {
    activity: {
      query: gql`
        query CommitActivity($streamId: String!, $commitId: String!) {
          stream(id: $streamId) {
            id
            commit(id: $commitId) {
              id
              activity(actionType: "commit_receive", limit: 200) {
                items {
                  info
                  time
                  userId
                  message
                }
              }
            }
          }
        }
      `,
      update: (data) => data.stream.commit.activity,
      variables() {
        return {
          streamId: this.streamId,
          commitId: this.commitId
        }
      },
      skip() {
        if (!this.streamId || !this.commitId) return true
        return false
      }
    }
  },
  computed: {
    receivedUsersUnique() {
      if (!(this.activity && this.activity.items && this.activity.items.length > 0))
        return []
      const set = new Set()
      this.activity.items.forEach((item) => set.add(item.userId))
      return Array.from(set)
    }
  }
}
</script>
