<template>
  <div>
    <prioritized-portal to="toolbar" identity="commits-multi-select" :priority="2">
      <div class="font-weight-bold">{{ count }} commits selected</div>
    </prioritized-portal>

    <prioritized-portal to="actions" identity="commits-multi-select" :priority="2">
      <div class="d-flex align-center">
        <v-btn small @click="clear">Clear selection</v-btn>
        <v-btn v-if="streamId" small class="ml-2" color="primary" @click="initMove">
          Move To
        </v-btn>
        <v-btn small class="mx-2" color="red" @click="initDelete">Delete</v-btn>
      </div>
    </prioritized-portal>

    <commits-batch-actions-dialog
      :show.sync="showDialog"
      :stream-id="streamId"
      :branch-name="branchName"
      :selected-commit-ids="selectedCommitIds"
      :type="dialogType"
      @finish="onFinish"
    />
  </div>
</template>
<script lang="ts">
import { Optional } from '@/helpers/typeHelpers'
import PrioritizedPortal from '@/main/components/common/utility/PrioritizedPortal.vue'
import CommitsBatchActionsDialog from '@/main/dialogs/commit/CommitsBatchActionsDialog.vue'
import { BatchActionType } from '@/main/lib/stream/composables/commitMultiActions'
import { computed, defineComponent, PropType, ref } from 'vue'

export default defineComponent({
  name: 'CommitMultiSelectToolbar',
  components: {
    PrioritizedPortal,
    CommitsBatchActionsDialog
  },
  props: {
    streamId: {
      type: String as PropType<Optional<string>>,
      default: undefined
    },
    selectedCommitIds: {
      type: Array as PropType<string[]>,
      required: true
    },
    branchName: {
      type: String as PropType<Optional<string>>,
      default: undefined
    }
  },
  setup(props, { emit }) {
    const showDialog = ref(false)
    const dialogType = ref(BatchActionType.Delete)

    const count = computed(() => props.selectedCommitIds?.length || 0)

    const clear = () => emit('clear')
    const initMove = () => {
      if (!props.streamId) return

      showDialog.value = true
      dialogType.value = BatchActionType.Move
    }
    const initDelete = () => {
      showDialog.value = true
      dialogType.value = BatchActionType.Delete
    }
    const onFinish = (payload: unknown) => {
      clear()
      emit('finish', payload)
    }

    return { clear, count, showDialog, initMove, initDelete, onFinish, dialogType }
  }
})
</script>
