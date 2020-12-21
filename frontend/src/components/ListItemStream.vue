<template>
  <v-card class="pa-5 mb-2 elevation-0" color="background2" :to="'/streams/' + stream.id">
    <v-row>
      <v-col cols="12" sm="8" class="align-self-center">
        <div class="subtitle-2">
          {{ stream.name }}
        </div>
        <div class="caption">
          Created
          <timeago :datetime="stream.createdAt"></timeago>
          , updated
          <timeago :datetime="stream.updatedAt"></timeago>
        </div>
        <v-divider class="my-3" />
        <v-chip small class="mr-3">
          <v-icon small left>mdi-source-branch</v-icon>
          {{ stream.branches.totalCount }} branches
        </v-chip>
        <v-chip small class="mr-3">
          <v-icon small left>mdi-source-commit</v-icon>
          {{ stream.commits.totalCount }} commits
        </v-chip>
        <!-- <v-icon v-if="stream.isPublic" v-tooltip="`Link sharing on`" small>mdi-link</v-icon>
        <v-icon v-else v-tooltip="`Link sharing off`" small>mdi-shield-lock</v-icon> -->
      </v-col>
      <v-col cols="12" sm="4" class="text-sm-center text-md-right align-self-center">
        <div>
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
import UserAvatar from '../components/UserAvatar'

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
