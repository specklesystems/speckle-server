<template>
  <div>
    <div
      :class="`${background} d-flex px-2 py-3 mb-2 align-center rounded-lg`"
      :style="`${highlighted ? 'outline: 0.2rem solid #047EFB;' : ''}`"
    >
      <v-checkbox
        v-if="allowSelect"
        v-model="selectedState"
        dense
        hide-details
        class="mt-0 ml-2 pa-0"
        @change="onSelect"
      />
      <div class="flex-shrink-0">
        <user-avatar :id="commit.authorId" :size="30" />
      </div>
      <div class="text-body-1 ml-4 text-truncate">
        <router-link
          v-if="links"
          class="text-decoration-none"
          :to="route ? route : `/streams/${streamId}/commits/${commit.id}`"
        >
          {{ commit.message }}
        </router-link>
        <span v-else>{{ commit.message }}</span>
        <div class="caption text-truncate">
          <b>{{ commit.authorName }}</b>
          &nbsp;
          <timeago :datetime="commit.createdAt"></timeago>
          ({{ new Date(commit.createdAt).toLocaleString() }})
        </div>
      </div>
      <div class="text-right flex-grow-1">
        <commit-received-receipts
          v-if="showReceivedReceipts"
          :stream-id="streamId"
          :commit-id="commit.id"
        />
        <span v-if="commit.branchName && showBranch" class="caption">
          <v-chip
            v-if="links"
            v-tooltip="`On branch '${commit.branchName}'`"
            small
            color="primary"
            :to="`/streams/${streamId}/branches/${commit.branchName}`"
          >
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </v-chip>
          <v-chip v-else small>
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </v-chip>
        </span>
        <source-app-avatar
          v-if="showSourceApp"
          :application-name="commit.sourceApplication"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import { limitedCommitActivityFieldsFragment } from '@/graphql/fragments/activity'
import { useSelectableCommit } from '@/main/lib/stream/composables/commitMultiActions'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar'),
    CommitReceivedReceipts: () =>
      import('@/main/components/common/CommitReceivedReceipts')
  },
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
    },
    showSourceApp: {
      type: Boolean,
      default: true
    },
    showBranch: {
      type: Boolean,
      default: true
    },
    transparent: {
      type: Boolean,
      default: false
    },
    links: {
      type: Boolean,
      default: true
    },
    highlight: {
      type: Boolean,
      default: false
    },
    allowSelect: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  setup(props, ctx) {
    const { highlighted, selectedState, onSelect } = useSelectableCommit(props, ctx)

    return { highlighted, selectedState, onSelect }
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
                  ...LimitedCommitActivityFields
                }
              }
            }
          }
        }

        ${limitedCommitActivityFieldsFragment}
      `,
      update: (data) => data.stream.commit.activity,
      variables() {
        return {
          streamId: this.streamId,
          commitId: this.commit.id
        }
      },
      skip() {
        if (!this.streamId || !this.commit || !this.showReceivedReceipts) return true
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
    background() {
      if (this.transparent) return ''
      return this.$vuetify.theme.dark ? 'grey darken-4' : 'white'
    },
    commitDate() {
      if (!this.commit) return null
      const date = new Date(this.commit.createdAt)
      const options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    branchUrl() {
      if (!this.commit) return null
      return `${window.location.origin}/streams/${
        this.$route.params.streamId
      }/branches/${encodeURIComponent(this.commit.branchName)}`
    },
    receivedUsersUnique() {
      if (!(this.activity && this.activity.items && this.activity.items.length > 0))
        return []
      const set = new Set()
      this.activity.items.forEach((item) => set.add(item.userId))
      return Array.from(set)
    }
  },
  methods: {
    goToBranch() {
      this.$router.push(this.branchUrl)
    }
  }
}
</script>
