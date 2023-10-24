<template>
  <v-hover v-slot="{ hover }">
    <v-card
      :class="`rounded-lg overflow-hidden`"
      :elevation="hover ? 10 : 1"
      :style="`${highlighted ? 'outline: 0.2rem solid #047EFB;' : ''}`"
    >
      <router-link :to="`/streams/${streamId}/commits/${commit.id}`">
        <preview-image
          :url="`/preview/${streamId}/commits/${commit.id}`"
          :height="previewHeight"
          rotate
        ></preview-image>
      </router-link>
      <v-toolbar class="transparent elevation-0" dense>
        <v-toolbar-title class="d-flex" style="overflow: visible; width: 100%">
          <div
            v-tooltip="selectDisabled ? selectDisabledMessage : undefined"
            class="checkbox-hover-wrapper"
          >
            <v-checkbox
              v-if="selectable"
              v-model="selectedState"
              :disabled="selectDisabled"
              dense
              hide-details
              @change="onSelect"
            />
          </div>
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
            <router-link
              class="text-decoration-none"
              :to="`/streams/${streamId}/commits/${commit.id}`"
            >
              <v-icon v-if="!selectable" small>mdi-source-commit</v-icon>
              {{ commit.message }}
            </router-link>
          </div>
        </v-toolbar-title>
      </v-toolbar>
      <div class="mx-1 mb-2">
        <v-card-text class="caption d-flex pb-2 pt-0">
          <div>
            Created
            <timeago :datetime="commit.createdAt"></timeago>
          </div>
          <div class="text-right flex-grow-1">
            <span>({{ new Date(commit.createdAt).toLocaleString() }})</span>
          </div>
        </v-card-text>
      </div>
      <v-divider v-if="showStreamAndBranch" />
      <div v-if="showStreamAndBranch" class="d-flex align-center caption px-5 py-2">
        <div v-show="streamName" class="text-truncate mr-2">
          <router-link
            class="text-decoration-none d-inline-flex align-center"
            :to="`/streams/${streamId}`"
          >
            <v-icon x-small class="primary--text mr-2">mdi-folder-outline</v-icon>
            {{ streamName }}
          </router-link>
        </div>
        <div class="text-right flex-grow-1 text-truncate">
          <router-link
            class="text-decoration-none d-inline-flex align-center"
            :to="`/streams/${streamId}/branches/${formatBranchNameForURL(
              commit.branchName
            )}`"
          >
            <v-icon x-small class="primary--text mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </router-link>
        </div>
      </div>
      <div class="card-top justify-space-between align-start">
        <div class="card-top__left flex-column align-start">
          <div>
            <source-app-avatar
              :application-name="commit.sourceApplication"
              style="margin: 0 !important"
            />
          </div>
          <v-chip
            v-if="commit.commentCount !== 0"
            v-tooltip="
              `${commit.commentCount} comment${commit.commentCount === 1 ? '' : 's'}`
            "
            small
            class="caption primary"
            dark
          >
            <v-icon x-small class="mr-1">mdi-comment-outline</v-icon>
            {{ commit.commentCount }}
          </v-chip>
          <commit-received-receipts
            :stream-id="streamId"
            :commit-id="commit.id"
            shadow
          />
        </div>
        <div class="card-top__right flex-column align-start">
          <commit-share-btn v-if="shareable" @share="onShareClicked" />
        </div>
      </div>
    </v-card>
  </v-hover>
</template>
<script>
import CommitShareBtn from '@/main/components/stream/commit/CommitShareBtn.vue'
import { useSelectableCommit } from '@/main/lib/stream/composables/commitMultiActions'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  components: {
    PreviewImage: () => import('@/main/components/common/PreviewImage'),
    CommitReceivedReceipts: () =>
      import('@/main/components/common/CommitReceivedReceipts'),
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar'),
    CommitShareBtn
  },
  props: {
    commit: { type: Object, default: () => null },
    previewHeight: { type: Number, default: () => 180 },
    showStreamAndBranch: { type: Boolean, default: true },
    /**
     * Whether to show a checkbox that would allow selecting this card
     */
    selectable: {
      type: Boolean,
      default: false
    },
    /**
     * Whether selection of this card is disabled
     */
    selectDisabled: {
      type: Boolean,
      default: false
    },
    /**
     * Message to show in a tooltip for a disabled card
     */
    selectDisabledMessage: {
      type: String,
      default: undefined
    },
    /**
     * Whether the card is currently selected
     */
    selected: {
      type: Boolean,
      default: false
    },
    /**
     * Whether to show a share button
     */
    shareable: {
      type: Boolean,
      default: false
    }
  },
  setup(props, ctx) {
    const { highlighted, selectedState, onSelect } = useSelectableCommit(props, ctx)
    const onShareClicked = () => ctx.emit('share', props.commit)

    return {
      highlighted,
      selectedState,
      onSelect,
      onShareClicked,
      formatBranchNameForURL
    }
  },
  computed: {
    streamId() {
      return (
        this.commit.streamId ||
        this.commit.stream?.id ||
        this.$route.params.streamId ||
        this.$route.query.stream
      )
    },
    streamName() {
      return this.commit.streamName || this.commit.stream?.name
    }
  }
}
</script>
<style lang="scss" scoped>
.card-top {
  $base: &;

  position: absolute;
  top: 10px;
  right: 12px;
  left: 12px;

  display: flex;

  #{$base}__left,
  #{$base}__right {
    display: flex;

    & > * {
      margin-bottom: 4px !important;
    }
  }
}
</style>
