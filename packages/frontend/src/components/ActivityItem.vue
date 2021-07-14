<template>
  <v-card :link="url !== null" :to="url">
    <v-card-text class="pa-2">
      <div
        :class="tagColor"
        class="rounded-pill pa-2 white--text d-inline-flex justify-center align-center"
      >
        <v-icon small color="white">{{ activityInfo.icon }}</v-icon>
      </div>
      <span class="pa-2">
        <span v-if="type !== 'stream_permissions'">
          {{ type | capitalize }}
          <span class="font-weight-bold font-italic primary--text">
            {{ activityInfo.name }}
          </span>
        </span>
        <span v-else>
          <v-chip v-if="user" small class="pl-0">
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
        <span>{{ activityInfo.modifier }}</span>
        <span id="streamAttribution" v-if="type !== 'stream' && type !== 'user'">
          in stream
          <span class="font-weight-bold font-italic primary--text">
            {{ stream ? stream.name : `[Deleted] ${activity.streamId}` }}
          </span>
        </span>
        <span>
          <timeago :datetime="activity.time" class="font-italic ma-1"></timeago>
        </span>
        <span id="userAttribution" v-if="type != 'user'">
          by
          <v-chip v-if="user" small class="pl-0">
            <v-avatar color="grey lighten-3" class="mr-1">
              <img
                :src="user.avatar || `https://robohash.org/` + activity.userId + `.png?size=40x40`"
                :alt="user.name"
              />
            </v-avatar>
            {{ user.name }}
          </v-chip>
          <v-progress-circular v-else indeterminate></v-progress-circular>
        </span>
      </span>
    </v-card-text>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'

export default {
  components: {},
  props: ['activity'],
  apollo: {
    user: {
      query: gql`
        query($id: String) {
          user(id: $id) {
            name
            avatar
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
      },
      skip() {
        return this.type === 'stream'
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
            name: this.activity.info.stream?.name,
            modifier: 'was created'
          }
        case 'stream_update':
          return {
            icon: 'mdi-cloud',
            name: this.activity.info.new?.name,
            modifier: 'was updated'
          }
        case 'stream_delete':
          return {
            icon: 'mdi-cloud-alert',
            name: this.activity.streamId,
            modifier: 'was deleted'
          }
        case 'stream_permissions_add':
          return {
            icon: 'mdi-cloud-alert',
            name: this.targetUser.name,
            modifier: 'was granted access as ' + this.activity.info.role.split(':')[1]
          }
        case 'stream_permissions_remove':
          return {
            icon: 'mdi-cloud-alert',
            name: 'User',
            modifier: 'was revoked access'
          }
        case 'commit_create':
          return {
            icon: 'mdi-timeline-plus',
            name: this.activity.resourceId,
            modifier: 'was created'
          }
        case 'commit_delete':
          return {
            icon: 'mdi-timeline-minus',
            name: this.activity.resourceId,
            modifier: 'was deleted'
          }
        case 'branch_create':
          return {
            icon: 'mdi-source-branch-plus',
            name: this.activity.info.branch.name,
            modifier: 'was created'
          }
        case 'branch_delete':
          return {
            icon: 'mdi-source-branch-minus',
            name: this.activity.info.branch.name,
            modifier: 'was deleted'
          }
        case 'branch_update':
          return {
            icon: 'mdi-source-branch-sync',
            name: this.activity.info.new.name,
            modifier: 'was updated'
          }
        case 'user_create':
          return {
            icon: 'mdi-account-plus',
            name: this.activity.info.user.name,
            modifier: 'was created'
          }
        case 'user_update':
          return {
            icon: 'mdi-account-convert',
            name: this.activity.info.new.name,
            modifier: 'was updated'
          }
        case 'user_delete':
          return {
            icon: 'mdi-account-remove',
            name: this.activity.resourceId,
            modifier: 'was deleted'
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
  methods: {}
}
</script>

<style></style>
