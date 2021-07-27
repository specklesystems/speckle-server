<template>
  <div>
    <div v-if="user" class="caption mb-2">
      <user-avatar :id="user.id" :avatar="user.avatar" :size="30" :name="user.name" />
      &nbsp;
      <a target="_blank" :href="'/profile/' + user.id">{{ user.name }}</a>
      &nbsp;
      <span>{{ activityInfo.modifier }} &nbsp;</span>
      <span v-if="stream">
        <a target="_blank" :href="'/streams/' + activity.streamId">{{ stream.name }}</a>
      </span>
      <timeago :datetime="activity.time" class="font-italic ma-1"></timeago>
    </div>
    <v-card class="mb-5 activity-card">
      <v-card-text class="pa-5 subtitle-1">
        <!-- <div
          :class="tagColor"
          class="rounded-pill pa-2 white--text d-inline-flex justify-center align-center"
        >
          <v-icon small color="white">{{ activityInfo.icon }}</v-icon>
        </div> -->
        <span>
          <span v-if="activityInfo.description" v-html="activityInfo.description"></span>
          <span v-else-if="type !== 'stream_permissions'">
            {{ type | capitalize }}
            <span class="font-weight-bold font-italic primary--text">
              {{ activityInfo.name }}
            </span>
          </span>
          <span v-else>
            <v-chip v-if="targetUser" small class="pl-0">
              <v-avatar color="grey lighten-3" class="mr-1">
                <img
                  :src="
                    targetUser.avatar || `https://robohash.org/` + targetUser.id + `.png?size=40x40`
                  "
                  :alt="targetUser.name"
                />
              </v-avatar>
              {{ user.name }}
            </v-chip>
            <v-progress-circular v-else indeterminate></v-progress-circular>
          </span>

          <span v-if="type !== 'stream' && type !== 'user'" id="streamAttribution">
            in stream
            <span class="font-weight-bold font-italic primary--text">
              {{ stream ? stream.name : `[Deleted] ${activity.streamId}` }}
            </span>
          </span>
        </span>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import UserAvatar from './UserAvatar'
import gql from 'graphql-tag'

export default {
  components: { UserAvatar },
  props: ['activity'],
  apollo: {
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
      query() {
        return gql`
          query targetUser($id: String) {
            user(id: $id) {
              name
              avatar
              id
            }
          }
        `
      },
      update: (data) => data.user,
      variables() {
        return {
          id: this.activity.info.targetUser
        }
      },
      skip() {
        return this.activity.info.targetUser === null || this.activity.info.targetUser === undefined
      }
    },

    stream: {
      query: gql`
        query($id: String!) {
          stream(id: $id) {
            name
          }
        }
      `,
      variables() {
        return {
          id: this.activity.streamId
        }
      }
    }
  },
  computed: {
    modifier() {
      return this.activity.actionType.split('_').pop()
    },
    type() {
      var x = this.activity.actionType.split('_')
      x.pop()
      return x.join('_')
    },
    url() {
      if (this.modifier === 'delete' || this.modifier === 'remove') return null
      switch (this.type) {
        case 'stream':
          return `/streams/${this.activity.streamId}`
        case 'stream_permissions':
          return `/streams/${this.activity.streamId}`
        case 'branch':
          return `/streams/${this.activity.streamId}/branches/${this.activity.info.branch?.name}`
        case 'commit':
          return `/streams/${this.activity.streamId}/commits/${this.activity.resourceId}`
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
            icon: 'mdi-cloud',
            modifier: 'created'
          }
        case 'stream_update':
          return {
            icon: 'mdi-cloud',
            modifier: 'updated',
            description: this.streamUpdatedDescription()
          }
        case 'stream_delete':
          return {
            icon: 'mdi-cloud-alert',
            modifier: 'deleted'
          }
        case 'stream_permissions_add':
          return {
            icon: 'mdi-cloud-alert',
            modifier: 'added a user to'
          }
        case 'stream_permissions_remove':
          return {
            icon: 'mdi-cloud-alert',
            modifier: 'removed a user from'
          }
        case 'commit_create':
          return {
            icon: 'mdi-timeline-plus',
            modifier: 'pushed to'
          }
        case 'commit_delete':
          return {
            icon: 'mdi-timeline-minus',
            modifier: 'deleted a commit from'
          }
        case 'branch_create':
          return {
            icon: 'mdi-source-branch-plus',
            modifier: 'branched'
          }
        case 'branch_delete':
          return {
            icon: 'mdi-source-branch-minus',
            modifier: 'deleted a branch from'
          }
        case 'branch_update':
          return {
            icon: 'mdi-source-branch-sync',
            modifier: 'updated a branch in'
          }
        case 'user_create':
          return {
            icon: 'mdi-account-plus',
            modifier: 'created'
          }
        case 'user_update':
          return {
            icon: 'mdi-account-convert',
            modifier: 'updated'
          }
        case 'user_delete':
          return {
            icon: 'mdi-account-remove',
            modifier: 'deleted'
          }
        default:
          return {
            icon: 'mdi-box',
            name: this.activity.actionType
          }
      }
    },

    tagColor() {
      var split = this.activity.actionType.split('_')
      var mod = split[split.length - 1]
      console.log('mod', this.activity.actionType, mod)
      switch (mod) {
        case 'create':
          return 'success'
        case 'add':
          return 'success'
        case 'delete':
          return 'error'
        case 'remove':
          return 'error'
        default:
          return 'primary'
      }
    }
  },
  methods: {
    streamUpdatedDescription() {
      let changes = ''
      for (const [key] of Object.entries(this.activity.info.new)) {
        if (
          this.activity.info.old[key] !== undefined &&
          this.activity.info.new[key] !== this.activity.info.old[key]
        ) {
          if (key === 'name')
            changes +=
              '<p>✏️ Renamed from <i>' +
              this.activity.info.old[key] +
              '</i> to <i>' +
              this.activity.info.new[key] +
              '</i></p>'
          if (key === 'description')
            changes +=
              '<p>📋 Description changed from <i>' +
              this.truncate(this.activity.info.old[key]) +
              '</i> to <i>' +
              this.truncate(this.activity.info.new[key]) +
              '</ib></p>'
          if (key === 'isPublic' && this.activity.info.new[key])
            changes += '<p>👀 Stream is now <i>public</i></p>'
          if (key === 'isPublic' && !this.activity.info.new[key])
            changes += '<p>👀 Stream is now <i>private</i></p>'
        }
      }

      return changes
    },
    truncate(input) {
      if (input.length > 25) {
        return input.substring(0, 25) + '...'
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
</style>
