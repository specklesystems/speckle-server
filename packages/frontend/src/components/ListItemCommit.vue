<template>
  <v-list-item class="xxx-elevation-10">
    <v-list-item-icon class="pl-4">
      <user-avatar
        :id="commit.authorId"
        :avatar="commit.authorAvatar"
        :name="commit.authorName"
        :size="40"
      />
    </v-list-item-icon>

    <v-list-item-content>
      <router-link
        class="text-decoration-none"
        :to="route ? route : `/streams/${streamId}/commits/${commit.id}`"
      >
        <v-list-item-title class="mt-0 pt-0 py-1">
          {{ commit.message }}
        </v-list-item-title>
        <v-list-item-subtitle class="caption">
          <b>{{ commit.authorName }}</b>
          &nbsp;
          <timeago :datetime="commit.createdAt"></timeago>
          ({{ commitDate }})
        </v-list-item-subtitle>
      </router-link>
    </v-list-item-content>
    <commit-received-receipts
      v-if="showReceivedReceipts"
      :stream-id="streamId"
      :commit-id="commit.id"
    />
    <v-list-item-action>
      <div>
        <span v-if="commit.branchName" class="caption">
          <v-chip
            v-tooltip="`On branch '${commit.branchName}'`"
            small
            color="primary"
            :to="`/streams/${streamId}/branches/${commit.branchName}`"
          >
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </v-chip>
        </span>
        <source-app-avatar :application-name="commit.sourceApplication" />
      </div>
    </v-list-item-action>
  </v-list-item>
</template>
<script>
import gql from 'graphql-tag'
import UserAvatar from './UserAvatar'
import SourceAppAvatar from './SourceAppAvatar'
import CommitReceivedReceipts from './CommitReceivedReceipts'

export default {
  components: { UserAvatar, SourceAppAvatar, CommitReceivedReceipts },
  props: {
    commit: {
      type: Object,
      default: null
    },
    streamId: {
      type: String,
      default: null
    },
    route: {
      type: String,
      default: null
    },
    showReceivedReceipts: {
      type: Boolean,
      default: false
    }
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
          commitId: this.commit.id
        }
      },
      skip() {
        if (!this.streamId || !this.commit) return true
        return false
      }
    }
  },
  data() {
    return {
      activity: null,
      showAllActivityDialog: false,
      userData: null,
      currentId: null
    }
  },
  computed: {
    commitDate() {
      if (!this.commit) return null
      let date = new Date(this.commit.createdAt)
      let options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    branchUrl() {
      if (!this.commit) return null
      return `${window.location.origin}/streams/${
        this.$route.params.streamId
      }/branches/${encodeURIComponent(this.commit.branchName)}`
    },
    receivedUsersUnique() {
      if (!(this.activity && this.activity.items && this.activity.items.length > 0)) return []
      let set = new Set()
      this.activity.items.forEach((item) => set.add(item.userId))
      return Array.from(set)
    }
  },
  watch: {
    // activity(val) {
    //   let set = new Set()
    //   if (val && val.items && val.items.length > 0) {
    //     val.items.forEach((item) => set.add(item.userId))
    //     this.receivedUsersUnique = Array.from(set)
    //   }
    // }
  },
  methods: {
    goToBranch() {
      this.$router.push(this.branchUrl)
    }
  }
}
</script>
