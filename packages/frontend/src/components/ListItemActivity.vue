<template>
  <v-timeline-item medium>
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
          <span>&nbsp;{{ activityInfo.captionText }} &nbsp;</span>
          <span v-if="stream">
            <router-link :to="'/streams/' + stream.id">{{ stream.name }}</router-link>
          </span>
          <timeago :datetime="activity.time" class="font-italic ma-1"></timeago>
        </div>
      </v-col>
      <v-col cols="12">
        <!-- STREAM PERMISSIONS -->
        <v-card
          v-if="activity.actionType.includes('stream_permissions') && stream"
          class="activity-card"
          flat
        >
          <v-card-text class="pa-5 body-1">
            <v-container>
              <v-row class="align-center">
                <v-chip v-if="targetUser" pill :color="activityInfo.color">
                  <v-avatar left>
                    <user-avatar
                      :id="targetUser.id"
                      :avatar="targetUser.avatar"
                      :size="30"
                      :name="targetUser.name"
                    />
                  </v-avatar>

                  {{ targetUser.name }}
                </v-chip>

                <span class="ml-3 body-2 font-italic">{{ activityInfo.actionText }}</span>
                <v-chip v-if="activity.info.role" small outlined class="ml-3">
                  <v-icon small left>mdi-account-key-outline</v-icon>
                  {{ activity.info.role.split(':')[1] }}
                </v-chip>
                <v-spacer />

                <v-btn
                  v-if="
                    targetUser &&
                    activity.actionType === `stream_permissions_add` &&
                    $vuetify.breakpoint.smAndUp
                  "
                  text
                  outlined
                  small
                  :to="'/profile/' + targetUser.id"
                  color="primary"
                >
                  view
                </v-btn>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>

        <!-- STREAM -->
        <v-card v-else-if="activity.resourceType === 'stream' && stream" class="activity-card" flat>
          <v-card-text class="pa-5 body-1">
            <v-container>
              <v-row class="align-center">
                <router-link :to="url" class="title">
                  <v-icon color="primary" small>mdi-compare-vertical</v-icon>
                  {{ stream.name }}
                </router-link>
                <span class="ml-3 body-2 font-italic">{{ activityInfo.actionText }}</span>

                <v-spacer />

                <v-btn
                  v-if="
                    (activity.actionType === `stream_create` ||
                      activity.actionType === `stream_update`) &&
                    $vuetify.breakpoint.smAndUp
                  "
                  text
                  outlined
                  small
                  :to="url"
                  color="primary"
                >
                  view
                </v-btn>
              </v-row>
            </v-container>

            <div
              v-if="activityInfo.description"
              class="mt-3"
              v-html="activityInfo.description"
            ></div>
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
              <v-chip small outlined class="ml-3 no-hover">
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
        <v-card v-else-if="activity.resourceType === 'branch'" class="activity-card" flat>
          <v-card-text class="pa-5 body-1">
            <v-chip :to="url" :color="activityInfo.color">
              <v-icon small class="mr-2 float-left" light>{{ activityInfo.icon }}</v-icon>
              {{ branchName }}
            </v-chip>
            <span class="ml-3 body-2 font-italic">{{ activityInfo.actionText }}</span>
            <div
              v-if="activityInfo.description"
              class="mt-3"
              v-html="activityInfo.description"
            ></div>
          </v-card-text>
        </v-card>

        <!-- COMMITS -->
        <v-card v-else-if="activity.resourceType === 'commit'" class="activity-card" flat>
          <v-container>
            <v-row class="align-center">
              <v-col sm="10" cols="12">
                <v-card-text class="pa-5">
                  <div>
                    <v-chip :to="url" :color="activityInfo.color">
                      <v-icon small class="mr-2 float-left" light>{{ activityInfo.icon }}</v-icon>
                      {{ activity.resourceId }}
                    </v-chip>
                    <span class="mx-3 body-2 font-italic">{{ activityInfo.actionText }}</span>
                    <span v-if="activity.actionType !== 'commit_delete' && commit">
                      <v-chip
                        :to="`/streams/${activity.streamId}/branches/${commit.branchName}`"
                        small
                        color="primary"
                      >
                        <v-icon small class="float-left" light>mdi-source-branch</v-icon>
                        {{ commit.branchName }}
                      </v-chip>
                      <span v-if="activity.actionType === 'commit_create'">
                        <span class="mx-3 body-2 font-italic">from</span>
                        <source-app-avatar :application-name="commit.sourceApplication" />
                      </span>
                    </span>
                    <span v-if="activity.actionType !== 'commit_delete' && !commit">
                      [commit deleted]
                    </span>
                  </div>
                  <div
                    v-if="activityInfo.description"
                    class="mt-3 body-1"
                    v-html="activityInfo.description"
                  ></div>
                </v-card-text>
              </v-col>

              <v-col sm="2" cols="12">
                <v-hover
                  v-if="activity.actionType !== 'commit_delete' && commit"
                  v-slot="{ hover }"
                >
                  <router-link :to="url">
                    <preview-image
                      :url="`/preview/${activity.streamId}/commits/${activity.resourceId}`"
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
import UserAvatar from './UserAvatar'
import SourceAppAvatar from './SourceAppAvatar'
import PreviewImage from './PreviewImage'
import gql from 'graphql-tag'

export default {
  components: { UserAvatar, SourceAppAvatar, PreviewImage },
  props: ['activity'],
  apollo: {
    you: {
      query: gql`
        query {
          user {
            id
            name
          }
        }
      `,
      update: (data) => data.user
    },
    user: {
      query: gql`
        query($id: String) {
          user(id: $id) {
            name
            avatar
            id
          }
        }
      `,
      variables() {
        return {
          id: this.activity.userId
        }
      }
    },
    targetUser: {
      query: gql`
        query targetUser($id: String) {
          user(id: $id) {
            name
            avatar
            id
          }
        }
      `,
      update: (data) => data.user,
      variables() {
        return {
          id: this.activity.info.targetUser
        }
      },
      skip() {
        return !this.activity.info.targetUser
      }
    },

    stream: {
      query: gql`
        query($id: String!) {
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
          id: this.activity.streamId
        }
      }
    },
    branch: {
      query: gql`
        query($id: String!, $branchName: String!) {
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
          id: this.activity.streamId,
          branchName: this.branchName
        }
      },
      skip() {
        return this.activity.resourceType !== 'branch'
      },
      update: (data) => data.stream.branch
    },
    commit: {
      query: gql`
        query($id: String!, $commitId: String!) {
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
          id: this.activity.streamId,
          commitId: this.activity.resourceId
        }
      },
      skip() {
        return this.activity.resourceType !== 'commit'
      },
      update: (data) => data.stream.commit
    }
  },
  computed: {
    userName() {
      return this.user.id === this.you.id ? 'You' : this.user.name
    },
    captionText() {
      return this.activity.actionType.split('_').pop()
    },
    branchName() {
      if (this.activity.info?.branch) return this.activity.info.branch.name
      else if (this.activity.info?.new?.name) return this.activity.info.new.name
      else if (this.activity.info?.old?.name) return this.activity.info.old.name
      return ''
    },
    url() {
      switch (this.activity.resourceType) {
        case 'stream':
          return this.stream ? `/streams/${this.activity.streamId}` : null
        case 'branch':
          return this.branch
            ? `/streams/${this.activity.streamId}/branches/${this.branchName}`
            : null
        case 'commit':
          return this.commit
            ? `/streams/${this.activity.streamId}/commits/${this.activity.resourceId}`
            : null
        case 'user':
          return '/profile'
        default:
          return null
      }
    },

    activityInfo() {
      switch (this.activity.actionType) {
        case 'stream_create':
          return {
            captionText: 'created',
            actionText: 'new stream',
            description: this.activity?.info?.stream?.description
              ? this.truncate(this.activity.info.stream.description, 50)
              : ''
          }
        case 'stream_update':
          return {
            captionText: 'updated',
            actionText: 'stream updated',
            description: this.updatedDescription()
          }
        case 'stream_delete': //not used
          return {
            captionText: 'deleted'
          }
        case 'stream_permissions_add':
          return {
            captionText: 'added a user to',
            actionText: 'user added as ',
            color: 'success'
          }
        case 'stream_permissions_remove':
          return {
            captionText: 'removed a user from',
            actionText: 'user removed',
            color: 'error'
          }
        case 'branch_create':
          return {
            icon: 'mdi-source-branch-plus',
            captionText: 'created a branch in',
            actionText: 'new branch in',
            color: 'success',
            description: this.activity?.info?.branch?.description
              ? this.truncate(this.activity.info.branch.description, 50)
              : ''
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
            color: 'primary',
            description: this.updatedDescription()
          }
        case 'commit_create':
          return {
            icon: 'mdi-timeline-plus-outline',
            captionText: 'pushed to',
            actionText: 'new commit in',
            color: 'success',
            description: this.activity?.info?.commit?.message
          }
        case 'commit_update':
          return {
            icon: 'mdi-timeline-text-outline',
            captionText: 'updated a commit in',
            actionText: 'commit updated in',
            color: 'primary',
            description: this.updatedDescription()
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
            name: this.activity.actionType
          }
      }
    }
  },
  methods: {
    updatedDescription() {
      let changes = ''
      for (const [key] of Object.entries(this.activity.info.new)) {
        if (
          this.activity.info.old[key] !== undefined &&
          this.activity.info.new[key] !== this.activity.info.old[key]
        ) {
          if (key === 'name')
            changes +=
              '<p>✏️ Renamed from <i><del>' +
              this.activity.info.old[key] +
              '</del></i> to <i>' +
              this.activity.info.new[key] +
              '</i></p>'
          if (key === 'description') {
            let oldDesc = this.activity.info.old[key] ? this.activity.info.old[key] : 'empty'
            changes +=
              '<p>📋 Description changed from <i><del>' +
              this.truncate(oldDesc) +
              '</del></i> to <i>' +
              this.truncate(this.activity.info.new[key]) +
              '</ib></p>'
          }
          if (key === 'message') {
            let oldDesc = this.activity.info.old[key] ? this.activity.info.old[key] : 'empty'
            changes +=
              '<p>📋 Message changed from <i><del>' +
              this.truncate(oldDesc) +
              '</del></i> to <i>' +
              this.truncate(this.activity.info.new[key]) +
              '</ib></p>'
          }
          if (key === 'isPublic' && this.activity.info.new[key])
            changes += '<p>👀 Stream is now <i>public</i></p>'
          if (key === 'isPublic' && !this.activity.info.new[key])
            changes += '<p>👀 Stream is now <i>private</i></p>'
        }
      }

      return changes
    },
    truncate(input, length = 25) {
      if (!input) return ''
      if (input.length > length) {
        return input.substring(0, length) + '...'
      }
      return input
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
