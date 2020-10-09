<template>
  <v-row>
    <v-col cols="7">
      <div class="subtitle-2">
        <router-link :to="'streams/' + stream.id">
          {{ stream.name }}
        </router-link>
      </div>
      <div class="caption">
        {{ stream.description }}
      </div>
    </v-col>
    <!-- <v-spacer></v-spacer> -->
    <v-col cols="5" class="caption text-right">
      <div>
        <v-icon small>mdi-key-outline</v-icon>
        &nbsp;
        <span class="streamid">
          <router-link :to="'streams/' + stream.id">
            {{ stream.id }}
          </router-link>
        </span>

        <span class="ma-2"></span>
        <v-icon small>mdi-source-branch</v-icon>
        &nbsp;
        <span>{{ stream.branches.totalCount }}</span>

        <span class="ma-2"></span>
        <v-icon small>mdi-history</v-icon>
        &nbsp;
        <span>{{ stream.commits.totalCount }}</span>

        <span class="ma-2"></span>
        <v-icon small>mdi-account-outline</v-icon>
        &nbsp;
        <span>{{ stream.collaborators.length }}</span>

        <span class="ma-2"></span>
        <v-icon v-if="stream.isPublic" small>mdi-lock-open</v-icon>
        <v-icon v-else small>mdi-lock-outline</v-icon>
      </div>

      <div class="mt-1 grey--text text--lighten-1">
        Created
        <timeago :datetime="stream.createdAt"></timeago>
        , updated
        <timeago :datetime="stream.updatedAt"></timeago>
      </div>
    </v-col>
  </v-row>
</template>
<script>
export default {
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
