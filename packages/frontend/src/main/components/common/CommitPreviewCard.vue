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
          <v-checkbox
            v-if="allowSelect"
            v-model="selectedState"
            dense
            @change="onSelect"
          />
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
            <router-link
              class="text-decoration-none"
              :to="`/streams/${streamId}/commits/${commit.id}`"
            >
              <v-icon v-if="!allowSelect" small>mdi-source-commit</v-icon>
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
        <div v-show="commit.streamName" class="text-truncate mr-2">
          <router-link
            class="text-decoration-none d-inline-flex align-center"
            :to="`/streams/${streamId}`"
          >
            <v-icon x-small class="primary--text mr-2">mdi-folder-outline</v-icon>
            {{ commit.streamName }}
          </router-link>
        </div>
        <div class="text-right flex-grow-1 text-truncate">
          <router-link
            class="text-decoration-none d-inline-flex align-center"
            :to="`/streams/${streamId}/branches/${commit.branchName}`"
          >
            <v-icon x-small class="primary--text mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </router-link>
        </div>
      </div>
      <div style="position: absolute; top: 10px; right: 20px">
        <commit-received-receipts :stream-id="streamId" :commit-id="commit.id" shadow />
      </div>
      <div style="position: absolute; top: 10px; left: 12px">
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
        <source-app-avatar :application-name="commit.sourceApplication" />
      </div>
    </v-card>
  </v-hover>
</template>
<script>
export default {
  components: {
    PreviewImage: () => import('@/main/components/common/PreviewImage'),
    CommitReceivedReceipts: () =>
      import('@/main/components/common/CommitReceivedReceipts'),
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar')
  },
  props: {
    commit: { type: Object, default: () => null },
    previewHeight: { type: Number, default: () => 180 },
    showStreamAndBranch: { type: Boolean, default: true },
    highlight: { type: Boolean, default: false },
    allowSelect: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    highlighted() {
      return this.highlight || this.selected
    },
    streamId() {
      return (
        this.commit.streamId ?? this.$route.params.streamId ?? this.$route.query.stream
      )
    },
    selectedState: {
      get() {
        return this.selected
      },
      set(val) {
        this.$emit('update:selected', !!val)
      }
    }
  },
  methods: {
    onSelect() {
      this.$emit('select', { value: this.selected })
    }
  }
}
</script>
