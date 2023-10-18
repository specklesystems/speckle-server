<template>
  <!-- eslint-disable vue/no-v-html -->
  <v-timeline-item v-show="shouldShowComponent" medium>
    <template #icon>
      <user-avatar v-if="user" :id="user.id" :avatar="user.avatar" :name="user.name" />
    </template>
    <v-row class="pt-1 timeline-activity">
      <v-col cols="12" class="mb-0 pb-0">
        <div v-if="user && you && stream" class="body-2">
          &nbsp;
          <router-link :to="'/profile/' + user.id">
            {{ userName }}
          </router-link>
          <span>&nbsp;{{ lastActivityBrief.captionText }} &nbsp;</span>
          <span v-if="stream">
            <router-link :to="'/streams/' + stream.id">{{ stream.name }}</router-link>
          </span>
          <timeago :datetime="lastActivity.time" class="font-italic ma-1"></timeago>
        </div>
      </v-col>
      <v-col cols="12">
        <!-- STREAM PERMISSIONS -->
        <v-card
          v-if="lastActivity.actionType.includes('stream_permissions') && stream"
          class="activity-card"
          :flat="$vuetify.theme.dark"
        >
          <v-card-text class="pa-5 body-1">
            <v-container>
              <v-row
                v-for="activityItem in activityGroup"
                :key="activityItem.time"
                class="align-center"
              >
                <v-col cols="12" md="10">
                  <user-pill
                    class="mr-3"
                    :user-id="activityItem.info.targetUser || activityItem.userId"
                    :color="isUserAddedToStreamActivity ? 'success' : 'error'"
                  ></user-pill>

                  <span
                    v-if="$vuetify.breakpoint.smAndUp"
                    class="mr-3 body-2 font-italic"
                  >
                    {{ isUserAddedToStreamActivity ? 'user added as' : 'user removed' }}
                  </span>
                  <v-chip v-if="activityItem.info.role" small outlined class="my-2">
                    <v-icon small left>mdi-account-key-outline</v-icon>
                    {{ activityItem.info.role.split(':')[1] }}
                  </v-chip>
                </v-col>
                <v-col v-if="$vuetify.breakpoint.mdAndUp" cols="2" class="text-right">
                  <v-btn
                    v-if="
                      (activityItem.info.targetUser || activityItem.userId) &&
                      isUserAddedToStreamActivity
                    "
                    text
                    outlined
                    small
                    :to="
                      '/profile/' +
                      (activityItem.info.targetUser || activityItem.userId)
                    "
                    color="primary"
                  >
                    view
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>

        <!-- STREAM -->
        <v-card
          v-else-if="lastActivity.resourceType === 'stream' && stream"
          class="activity-card"
          :flat="$vuetify.theme.dark"
        >
          <v-card-text class="pa-5 body-1">
            <v-container>
              <v-row class="align-center">
                <router-link :to="url" class="title">
                  <v-icon color="primary" small>mdi-folder</v-icon>
                  {{ stream.name }}
                </router-link>
                <span class="ml-3 body-2 font-italic">
                  {{ lastActivityBrief.actionText }}
                </span>

                <v-spacer />

                <v-btn
                  v-if="
                    (STREAM_CREATED_TYPES.includes(lastActivity.actionType) ||
                      lastActivity.actionType === `stream_update`) &&
                    $vuetify.breakpoint.mdAndUp
                  "
                  text
                  outlined
                  small
                  exact
                  :to="url"
                  color="primary"
                >
                  view
                </v-btn>
              </v-row>
            </v-container>

            <div class="mt-3">
              <list-item-activity-description
                v-for="(item, idx) in activityGroup"
                :key="item.time"
                :activity-group="activityGroup"
                :activity-item-index="idx"
              />
            </div>
          </v-card-text>
          <v-card-actions class="pt-0">
            <div>
              <v-btn
                v-tooltip="
                  stream.branches.totalCount +
                  ' branch' +
                  (stream.branches.totalCount === 1 ? '' : 'es')
                "
                color="primary"
                text
                class="px-0 ml-3"
                small
                :to="'/streams/' + stream.id + '/branches'"
              >
                <v-icon small class="mr-2 float-left">mdi-source-branch</v-icon>
                {{ stream.branches.totalCount }}
              </v-btn>

              <v-btn
                v-tooltip="
                  stream.commits.totalCount +
                  ' commit' +
                  (stream.commits.totalCount === 1 ? '' : 's')
                "
                color="primary"
                text
                class="px-0 ml-3"
                small
                :to="'/streams/' + stream.id + '/branches/main'"
              >
                <v-icon small class="mr-2 float-left">mdi-source-commit</v-icon>
                {{ stream.commits.totalCount }}
              </v-btn>
              <v-chip v-if="stream.role" small outlined class="ml-3 no-hover">
                <v-icon small left>mdi-account-key-outline</v-icon>
                {{ stream.role.split(':')[1] }}
              </v-chip>
              <span class="caption mb-2 ml-3 font-italic">
                Updated
                <timeago :datetime="stream.updatedAt"></timeago>
              </span>
            </div>
          </v-card-actions>
        </v-card>

        <!-- BRANCHES -->
        <v-card
          v-else-if="lastActivity.resourceType === 'branch'"
          class="activity-card"
          :flat="$vuetify.theme.dark"
        >
          <v-card-text class="pa-5 body-1">
            <v-chip :to="url" :color="lastActivityBrief.color">
              <v-icon small class="mr-2 float-left" light>
                {{ lastActivityBrief.icon }}
              </v-icon>
              {{ branchName }}
            </v-chip>
            <span class="ml-3 body-2 font-italic">
              {{ lastActivityBrief.actionText }}
            </span>
            <div class="mt-3">
              <list-item-activity-description
                v-for="(item, idx) in activityGroup"
                :key="item.time"
                :activity-group="activityGroup"
                :activity-item-index="idx"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- COMMITS -->
        <v-card
          v-else-if="lastActivity.resourceType === 'commit' && commit"
          class="activity-card"
          :flat="$vuetify.theme.dark"
        >
          <v-container>
            <v-row class="align-center">
              <v-col sm="10" cols="12">
                <v-card-text class="pa-5">
                  <div>
                    <v-chip :to="url" :color="lastActivityBrief.color">
                      <v-icon small class="mr-2 float-left" light>
                        {{ lastActivityBrief.icon }}
                      </v-icon>
                      {{ lastActivity.resourceId }}
                    </v-chip>
                    <span class="mx-3 body-2 font-italic">
                      {{ lastActivityBrief.actionText }}
                    </span>
                    <span v-if="lastActivity.actionType !== 'commit_delete' && commit">
                      <v-chip
                        :to="`/streams/${
                          lastActivity.streamId
                        }/branches/${formatBranchNameForURL(commit.branchName)}`"
                        small
                        color="primary"
                      >
                        <v-icon v-if="commit" small class="float-left" light>
                          mdi-source-branch
                        </v-icon>
                        {{ commit.branchName }}
                      </v-chip>
                      <span v-if="lastActivity.actionType === 'commit_create'">
                        <span class="mx-3 body-2 font-italic">from</span>
                        <source-app-avatar
                          :application-name="commit.sourceApplication"
                        />
                      </span>
                      <span v-if="lastActivity.actionType === 'commit_receive'">
                        <span class="mx-3 body-2 font-italic">in</span>
                        <source-app-avatar
                          :application-name="lastActivity.info.sourceApplication"
                        />
                      </span>
                    </span>
                    <span v-if="lastActivity.actionType !== 'commit_delete' && !commit">
                      [commit deleted]
                    </span>
                  </div>
                  <div
                    v-if="lastActivity.info.commit && lastActivity.info.commit.message"
                    class="mt-3 body-1"
                  >
                    {{ lastActivity.info.commit.message }}
                  </div>
                  <!-- NOTE: currently assumes all commits are on the same branch
                  can't easily group them by branch as that info is not in the activity stream -->
                  <router-link
                    v-if="activityGroup.length > 1"
                    :to="`/streams/${
                      lastActivity.streamId
                    }/branches/${formatBranchNameForURL(commit.branchName)}`"
                    class="mt-5 caption"
                  >
                    SEE ALL {{ activityGroup.length }} COMMITS
                  </router-link>
                </v-card-text>
              </v-col>

              <v-col sm="2" cols="12">
                <v-hover
                  v-if="lastActivity.actionType !== 'commit_delete' && commit"
                  v-slot="{ hover }"
                >
                  <router-link :to="url">
                    <preview-image
                      :url="`/preview/${lastActivity.streamId}/commits/${lastActivity.resourceId}`"
                      :height="100"
                      :color="hover"
                    />
                  </router-link>
                </v-hover>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-timeline-item>
</template>

<script>
import UserAvatar from '@/main/components/common/UserAvatar'
import UserPill from '@/main/components/activity/UserPill'
import SourceAppAvatar from '@/main/components/common/SourceAppAvatar'
import PreviewImage from '@/main/components/common/PreviewImage'
import { gql } from '@apollo/client/core'
import ListItemActivityDescription from '@/main/components/activity/ListItemActivityDescription.vue'
import { STREAM_CREATED_TYPES } from '@/main/lib/feed/helpers/activityStream'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  components: {
    UserAvatar,
    SourceAppAvatar,
    PreviewImage,
    UserPill,
    ListItemActivityDescription
  },
  props: {
    activityGroup: {
      type: Array,
      default: () => []
    }
  },
  setup: () => ({ STREAM_CREATED_TYPES, formatBranchNameForURL }),
  apollo: {
    you: {
      query: gql`
        query {
          activeUser {
            id
            name
          }
        }
      `,
      update: (data) => data.activeUser
    },
    user: {
      query: gql`
        query ($id: String!) {
          otherUser(id: $id) {
            name
            avatar
            id
          }
        }
      `,
      update: (data) => data.otherUser,
      variables() {
        return {
          id: this.lastActivity.userId
        }
      }
    },

    stream: {
      query: gql`
        query ($id: String!) {
          stream(id: $id) {
            id
            name
            updatedAt
            role
            branches {
              totalCount
            }
            commits {
              totalCount
            }
          }
        }
      `,
      variables() {
        return {
          id: this.lastActivity.streamId
        }
      }
    },
    branch: {
      query: gql`
        query ($id: String!, $branchName: String!) {
          stream(id: $id) {
            id
            branch(name: $branchName) {
              id
            }
          }
        }
      `,
      variables() {
        return {
          id: this.lastActivity.streamId,
          branchName: this.branchName
        }
      },
      skip() {
        return this.lastActivity.resourceType !== 'branch'
      },
      update: (data) => data.stream.branch
    },
    commit: {
      query: gql`
        query ($id: String!, $commitId: String!) {
          stream(id: $id) {
            id
            commit(id: $commitId) {
              branchName
              sourceApplication
              id
            }
          }
        }
      `,
      variables() {
        return {
          id: this.lastActivity.streamId,
          commitId: this.lastActivity.resourceId
        }
      },
      skip() {
        return this.lastActivity.resourceType !== 'commit'
      },
      update: (data) => data.stream.commit
    }
  },
  computed: {
    shouldShowComponent() {
      if (this.lastActivity.actionType.includes('comment_')) return false
      if (this.lastActivity.actionType.includes('stream_permissions') && !this.user)
        return false

      return true
    },
    isUserAddedToStreamActivity() {
      const actionTypes = [
        'stream_permissions_add',
        'stream_permissions_invite_accepted'
      ]

      return actionTypes.includes(this.lastActivity?.actionType)
    },
    lastActivity() {
      return this.activityGroup[0]
    },
    userName() {
      return this.user.id === this.you.id ? 'You' : this.user.name
    },
    captionText() {
      return this.lastActivity.actionType.split('_').pop()
    },
    branchName() {
      if (this.lastActivity.info?.branch) return this.lastActivity.info.branch.name
      else if (this.lastActivity.info?.new?.name) return this.lastActivity.info.new.name
      else if (this.lastActivity.info?.old?.name) return this.lastActivity.info.old.name
      return ''
    },
    url() {
      switch (this.lastActivity.resourceType) {
        case 'stream':
          return this.stream ? `/streams/${this.lastActivity.streamId}` : null
        case 'branch':
          return this.branch
            ? `/streams/${this.lastActivity.streamId}/branches/${formatBranchNameForURL(
                this.branchName
              )}`
            : null
        case 'commit':
          return this.commit
            ? `/streams/${this.lastActivity.streamId}/commits/${this.lastActivity.resourceId}`
            : null
        case 'user':
          return '/profile'
        default:
          return null
      }
    },

    lastActivityBrief() {
      switch (this.lastActivity.actionType) {
        case 'stream_create':
        case 'stream_clone':
          return {
            captionText: 'created',
            actionText: 'new stream'
          }
        case 'stream_update':
          return {
            captionText: 'updated',
            actionText: 'stream updated'
          }
        case 'stream_delete': //not used
          return {
            captionText: 'deleted'
          }
        case 'stream_permissions_add':
          return {
            captionText: `added ${
              this.activityGroup.length === 1
                ? 'a user'
                : this.activityGroup.length + ' users'
            } to`
          }
        case 'stream_permissions_invite_accepted':
          return {
            captionText: `accepted an invitation to become a collaborator on`
          }
        case 'stream_permissions_remove': {
          const removedCount = this.activityGroup.length
          const removedSelf =
            this.lastActivity.userId === this.lastActivity.info?.targetUser

          if (removedCount > 1) {
            return {
              captionText: `removed ${removedCount} users from`
            }
          }

          if (removedSelf) {
            return {
              captionText: `left the stream`
            }
          }

          return { captionText: 'removed a user from' }
        }
        case 'branch_create':
          return {
            icon: 'mdi-source-branch-plus',
            captionText: 'created a branch in',
            actionText: 'new branch',
            color: 'success'
          }
        case 'branch_delete':
          return {
            icon: 'mdi-source-branch-minus',
            captionText: 'deleted a branch from',
            actionText: 'branch deleted',
            color: 'error'
          }
        case 'branch_update':
          return {
            icon: 'mdi-source-branch-sync',
            captionText: 'updated a branch in',
            actionText: 'branch updated in',
            color: 'primary'
          }
        case 'commit_create':
          return {
            icon: 'mdi-timeline-plus-outline',
            captionText: `pushed ${this.activityGroup.length} commit${
              this.activityGroup.length === 0 ? '' : 's'
            } to`,
            actionText: 'new commit in',
            color: 'success'
          }
        case 'commit_update':
          return {
            icon: 'mdi-timeline-text-outline',
            captionText: 'updated a commit in',
            actionText: 'commit updated in',
            color: 'primary'
          }
        case 'commit_receive':
          return {
            icon: 'mdi-source-branch-sync',
            captionText: 'received',
            actionText: 'commit received from',
            color: 'primary'
          }
        case 'commit_delete':
          return {
            icon: 'mdi-timeline-remove-outline',
            captionText: 'deleted a commit from',
            color: 'error',
            actionText: 'commit deleted'
          }

        case 'user_create':
          return {
            icon: 'mdi-account-plus',
            captionText: 'created'
          }
        case 'user_update':
          return {
            icon: 'mdi-account-convert',
            captionText: 'updated'
          }
        case 'user_delete':
          return {
            icon: 'mdi-account-remove',
            captionText: 'deleted'
          }
        default:
          return {
            icon: 'mdi-box',
            name: this.lastActivity.actionType
          }
      }
    }
  }
}
</script>

<style>
.activity-card p {
  margin: 0 !important;
}
.timeline-activity a {
  text-decoration: none;
}
</style>
