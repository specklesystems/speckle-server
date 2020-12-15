<template>
  <v-card
    class="pa-5 mb-2 elevation-0"
    color="background2"
    :to="'streams/' + stream.id"
  >
    <v-row>
      <v-col cols="6">
        <div class="subtitle-2">
          {{ stream.name }}
        </div>
        <div class="caption">
          <code>{{ stream.id }}</code>
          Created
          <timeago :datetime="stream.createdAt"></timeago>
          , updated
          <timeago :datetime="stream.updatedAt"></timeago>
        </div>
      </v-col>
      <v-col cols="6" class="caption text-right">
        <div>
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
          &nbsp;
          <span>{{ stream.branches.totalCount }}</span>
          &nbsp;
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
          &nbsp;
          <span>{{ stream.commits.totalCount }}</span>
          &nbsp;
          <v-icon v-if="stream.isPublic" v-tooltip="`Link sharing on`" small>
            mdi-link
          </v-icon>
          &nbsp;&nbsp;&nbsp;
          <v-icon v-else v-tooltip="`Link sharing off`" small>
            mdi-shield-lock
          </v-icon>
          <user-avatar
            v-for="user in stream.collaborators"
            :id="user.id"
            :key="user.id"
            :avatar="user.avatar"
            :size="30"
            :name="user.name"
          />
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>
<script>
import UserAvatar from "../components/UserAvatar"

export default {
  components: { UserAvatar },
  props: {
    stream: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
