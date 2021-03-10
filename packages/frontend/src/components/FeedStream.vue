<template>
  <div class="pt-4">
    <div class="text-center" style="position: absolute">
      <user-avatar :id="user.id" :avatar="user.avatar" :name="user.name" :size="30" />
    </div>
    <div class="ml-12">
      <v-row class="caption">
        <v-col cols="12" class="pb-2 mb-3">
          <v-icon small>mdi-compare-vertical</v-icon>
          &nbsp; You have a
          <strong>new stream</strong>
          &nbsp;
          <timeago :datetime="stream.createdAt"></timeago>
        </v-col>
      </v-row>
      <v-card class="mb-3" elevation="0" rounded="lg">
        <v-row justify-center>
          <v-col cols="12">
            <v-card-title class="subtitle-2">
              <router-link :to="'streams/' + stream.id" class="mr-4">
                {{ stream.name }}
              </router-link>
              <div class="caption">
                <v-icon
                  v-tooltip="
                    stream.branches.totalCount +
                    ' branch' +
                    (stream.branches.totalCount === 1 ? '' : 'es')
                  "
                  small
                >
                  mdi-source-branch
                </v-icon>
                <span class="mr-2">{{ stream.branches.totalCount }}</span>
                <v-icon
                  v-tooltip="
                    stream.commits.totalCount +
                    ' commit' +
                    (stream.commits.totalCount === 1 ? '' : 's')
                  "
                  small
                >
                  mdi-source-commit
                </v-icon>
                <span class="mr-2">{{ stream.commits.totalCount }}</span>
                <v-icon
                  v-tooltip="
                    stream.collaborators.length +
                    ' collaborator' +
                    (stream.collaborators.length === 1 ? '' : 's')
                  "
                  small
                >
                  mdi-account-outline
                </v-icon>
                <span class="mr-2 pr-2">{{ stream.collaborators.length }}</span>
              </div>
            </v-card-title>
          </v-col>
        </v-row>
      </v-card>
    </div>
  </div>
</template>
<script>
import UserAvatar from './UserAvatar'

export default {
  components: { UserAvatar },
  props: {
    stream: {
      type: Object,
      default: function () {
        return {}
      }
    },
    user: {
      type: Object,
      default: function () {
        return {}
      }
    },
    isFeed: {
      type: Boolean,
      default: false
    }
  }
}
</script>
