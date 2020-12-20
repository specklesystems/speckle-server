<template>
  <div>
    <div class="text-center" style="position: absolute">
      <user-avatar :id="user.id" :avatar="user.avatar" :name="user.name" :size="30" />
    </div>
    <div class="ml-12">
      <v-row class="caption">
        <v-col cols="12" class="pb-2">
          <v-icon small>mdi-compare-vertical</v-icon>
          &nbsp; You have a
          <strong>new stream</strong>
          &nbsp;
          <timeago :datetime="stream.createdAt"></timeago>
        </v-col>
      </v-row>
      <v-card class="mb-3" elevation="0" rounded="lg" color="background2">
        <v-row>
          <v-col cols="7" class="pt-0 pb-0">
            <v-card-title class="subtitle-2">
              <router-link :to="'streams/' + stream.id">
                {{ stream.name }}
              </router-link>
            </v-card-title>
            <!-- <v-card-subtitle>
              {{ stream.description }}
            </v-card-subtitle> -->
          </v-col>

          <v-col cols="5" class="caption text-right">
            <div class="mt-1 mr-4">
              <btn-click-copy :text="stream.id"></btn-click-copy>
              <router-link :to="'streams/' + stream.id" class="streamid">
                <span>{{ stream.id }}</span>
              </router-link>

              <!-- <v-icon small>mdi-key-outline</v-icon> -->
              <span class="ma-2"></span>
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
              <span>{{ stream.branches.totalCount }}</span>

              <span class="ma-2"></span>
              <v-icon
                v-tooltip="
                  stream.commits.totalCount +
                  ' commit' +
                  (stream.commits.totalCount === 1 ? '' : 's')
                "
                small
              >
                mdi-history
              </v-icon>
              <span>{{ stream.commits.totalCount }}</span>

              <span class="ma-2"></span>
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
              <span>{{ stream.collaborators.length }}</span>

              <span class="ma-2"></span>
              <v-icon v-if="stream.isPublic" v-tooltip="`Link sharing on`" small>mdi-link</v-icon>
              <v-icon v-else v-tooltip="`Link sharing off`" small>mdi-link-lock</v-icon>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </div>
  </div>
</template>
<script>
import BtnClickCopy from './BtnClickCopy'
import UserAvatar from './UserAvatar'

export default {
  components: { BtnClickCopy, UserAvatar },
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
