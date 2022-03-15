<template>
  <div>
    <v-list dense nav class="mt-4 py-0 mb-3">
      <v-list-item
        :class="`px-2 list-overlay-${$vuetify.theme.dark ? 'dark' : 'light'} elevation-2`"
        style="position: sticky; top: 82px"
        @click="expand = !expand"
      >
        <v-list-item-action>
          <v-icon small>mdi-comment-outline</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Comments</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action class="pa-0 ma-0">
          <v-btn small icon @click.stop="expand = !expand">
            <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-scroll-y-transition>
      <div v-show="expand" class="px-2">
        <!-- <v-card v-for="comment in comments" :key="comment.id + '-card-sidebar'">
          <v-card-title>{{ comment.text }}</v-card-title>
        </v-card> -->
        <v-row
          v-for="comment in comments"
          :key="comment.id + '-card-sidebar'"
          no-gutters
          :class="`my-2 property-row rounded-lg ${
            $store.state.selectedComment && $store.state.selectedComment.id === comment.id
              ? 'elevation-5 selected'
              : ''
          }`"
          @click="$emit('select-comment', comment)"
        >
          <v-col cols="1" class="text-center" style="line-height: 30px">
            <user-avatar :id="comment.authorId" :size="20" />
          </v-col>
          <v-col
            cols="8"
            :class="`pl-2 body-2 text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
            style="line-height: 30px"
          >
            {{ comment.text }}
          </v-col>
          <v-col
            cols="3"
            :class="`caption pr-4 text-truncate px-1 text-right ${
              $vuetify.theme.dark ? 'grey--text' : ''
            }`"
            style="line-height: 30px"
          >
            <v-icon small>mdi-comment-outline</v-icon>
            {{ comment.replies.totalCount }}
          </v-col>
          <v-col cols="1" class="text-center" style="line-height: 30px">
            <!-- <user-avatar :id="comment.authorId" :size="20" /> -->
          </v-col>
          <v-col
            v-tooltip="new Date(comment.updatedAt).toLocaleString()"
            cols="11"
            :class="`pl-2 caption text-truncate px-1 grey--text ${
              $vuetify.theme.dark ? 'grey--text' : ''
            }`"
            style="line-height: 30px"
          >
            Last activity
            <timeago :datetime="comment.updatedAt" />
          </v-col>
        </v-row>
      </div>
    </v-scroll-y-transition>
  </div>
</template>
<script>
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comments: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      expand: true
    }
  }
}
</script>
<style scoped>
.property-row {
  transition: all 0.3s ease;
  background: rgba(120, 120, 120, 0.05);
}
.property-row:hover {
  background: rgba(120, 120, 120, 0.2);
  cursor: pointer;
}

.selected {
  background: rgba(120, 120, 120, 0.3);
}
</style>
