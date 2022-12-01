<template>
  <div>
    <v-list dense nav class="mt-4 py-0 mb-3">
      <v-list-item
        :class="`px-2 list-overlay-${
          $vuetify.theme.dark ? 'dark' : 'light'
        } elevation-2`"
        style="position: sticky; top: 82px"
        @click="expand = !expand"
      >
        <v-list-item-action>
          <v-icon small>mdi-comment-outline</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            Comments
            <span class="grey--text">({{ comments.length }})</span>
          </v-list-item-title>
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
        <div v-if="$userId() !== null" class="d-flex align-center px-2 mb-3">
          <span class="caption mr-1">Filter</span>
          <v-btn
            x-small
            class="ml-2"
            :depressed="filter === 'all'"
            :zzzcolor="`${filter === 'all' ? 'primary' : ''}`"
            @click="$emit('set-filter', 'all')"
          >
            <v-icon x-small class="mr-2">mdi-comment-outline</v-icon>
            all
          </v-btn>
          <v-btn
            x-small
            class="ml-2"
            :depressed="filter === 'unread'"
            :zzzcolor="`${filter === 'unread' ? 'primary' : ''}`"
            @click="$emit('set-filter', 'unread')"
          >
            <v-icon x-small class="mr-2">mdi-comment-alert-outline</v-icon>
            unread
          </v-btn>
          <v-btn
            x-small
            class="ml-2"
            :depressed="filter === 'none'"
            :zzzcolor="`${filter === 'none' ? 'primary' : ''}`"
            @click="$emit('set-filter', 'none')"
          >
            <v-icon x-small class="mr-2">mdi-comment-off-outline</v-icon>
            none
          </v-btn>
        </div>
        <v-row
          v-for="comment in visibleComments"
          :key="comment.id + '-card-sidebar'"
          no-gutters
          :class="`${isUnread(comment) ? 'border' : ''} my-2 property-row rounded-lg ${
            viewerState.selectedCommentMetaData &&
            viewerState.selectedCommentMetaData.id === comment.id
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
            :class="`pl-2 body-2 text-truncate px-1 ${
              $vuetify.theme.dark ? 'grey--text' : ''
            }`"
            style="line-height: 30px"
          >
            {{ documentToBasicString(comment.text.doc) }}
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
        <v-btn
          v-if="!isEmbed"
          small
          block
          class="rounded-xl"
          :to="`/streams/${streamId}/comments`"
        >
          all stream comments
        </v-btn>
      </div>
    </v-scroll-y-transition>
  </div>
</template>
<script>
import { documentToBasicString } from '@/main/lib/common/text-editor/documentHelper'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { useCommitObjectViewerParams } from '@/main/lib/viewer/commit-object-viewer/stateManager'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comments: {
      type: Array,
      default: () => []
    },
    filter: {
      type: String,
      default: 'all'
    }
  },
  setup() {
    const { streamId, resourceId, isEmbed } = useCommitObjectViewerParams()
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          selectedCommentMetaData {
            id
            selectionLocation
          }
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    return { viewerState, streamId, resourceId, isEmbed }
  },
  data() {
    return {
      expand: false,
      documentToBasicString
    }
  },
  computed: {
    visibleComments() {
      switch (this.filter) {
        case 'all':
          return this.comments
        case 'unread':
          return this.comments.filter((c) => this.isUnread(c))
        case 'none':
          return this.comments // important, hides in the display, but you can still see all comments
      }
      return this.comments
    }
  },
  methods: {
    isUnread(comment) {
      if (!this.$userId()) return false
      return new Date(comment.updatedAt) - new Date(comment.viewedAt) > 0
    }
  }
}
</script>
<style scoped>
.border {
  outline: 2px solid #047efb;
}
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
