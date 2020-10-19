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
        <btn-click-copy :text="stream.id"></btn-click-copy>
        &nbsp;
        <span class="streamid">
          <router-link :to="'streams/' + stream.id">
            <span>{{ stream.id }}</span>
          </router-link>
        </span>

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
        &nbsp;
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
        &nbsp;
        <span>{{ stream.collaborators.length }}</span>

        <span class="ma-2"></span>
        <v-icon v-if="stream.isPublic" v-tooltip="`Link sharing on`" small>
          mdi-link
        </v-icon>
        <v-icon v-else v-tooltip="`Link sharing off`" small>
          mdi-link-lock
        </v-icon>
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
import BtnClickCopy from "./BtnClickCopy"

export default {
  components: { BtnClickCopy },
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
