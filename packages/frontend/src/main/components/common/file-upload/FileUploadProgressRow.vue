<template>
  <div class="file-upload-progress-row relative">
    <v-btn
      v-if="!disabled"
      class="file-upload-progress-row__delete"
      icon
      small
      color="red"
      @click="onDelete"
    >
      <v-icon small>mdi-close</v-icon>
    </v-btn>
    <v-card class="file-upload-progress-row__card px-3 py-3 rounded-xl">
      <div class="d-flex align-end">
        <div v-tooltip="item.file.name" class="mr-1 text-subtitle-2 ellipsis-text">
          {{ item.file.name }}
        </div>
        <div class="text-caption grey--text">
          {{ prettyFileSize(item.file.size) }}
        </div>
      </div>
      <div
        v-if="errorMessage"
        v-tooltip="errorMessage"
        class="text-caption red--text ellipsis-text"
      >
        {{ errorMessage }}
      </div>
      <v-progress-linear
        v-if="item.progress > 0"
        :color="progressBarColor"
        height="4"
        :value="item.progress"
        stream
        class="my-1"
      />
    </v-card>
  </div>
</template>
<script lang="ts">
import { Nullable } from '@/helpers/typeHelpers'
import {
  prettyFileSize,
  UploadFileItem
} from '@/main/lib/common/file-upload/fileUploadHelper'
import Vue, { PropType } from 'vue'

export default Vue.extend({
  name: 'FileUploadProgressRow',
  props: {
    item: {
      type: Object as PropType<UploadFileItem>,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    prettyFileSize
  }),
  computed: {
    errorMessage(): Nullable<string> {
      if (this.item.error) return this.item.error.message
      if (this.item.result?.uploadError) return this.item.result.uploadError
      return null
    },
    progressBarColor(): string {
      if (this.errorMessage) return 'red'
      if (this.item.progress >= 100) return 'green'
      return 'primary'
    }
  },
  methods: {
    onDelete() {
      if (this.disabled) return
      this.$emit('delete', { id: this.item.id })
    }
  }
})
</script>
<style lang="scss" scoped>
.ellipsis-text {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.v-progress-linear {
  border-bottom-left-radius: unset !important;
  border-bottom-right-radius: unset !important;
}

.relative {
  position: relative;
}

.file-upload-progress-row {
  &__delete {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
    z-index: 30;
  }

  & > .v-card {
    overflow: auto;
  }
}
</style>
