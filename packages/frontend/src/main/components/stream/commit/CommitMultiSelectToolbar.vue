<template>
  <div>
    <prioritized-portal to="toolbar" identity="commits-multi-select" :priority="2">
      <div class="font-weight-bold">{{ count }} commits selected</div>
    </prioritized-portal>

    <prioritized-portal to="actions" identity="commits-multi-select" :priority="2">
      <div class="d-flex align-center">
        <v-btn small @click="clear">Clear selection</v-btn>
        <v-btn small class="ml-2" color="primary" @click="initMove">Move To</v-btn>
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
      type: String,
      required: true
    },
    selectedCommitIds: {
      type: Array as PropType<string[]>,
      required: true
    },
    branchName: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const showDialog = ref(false)
    const dialogType = ref(BatchActionType.Move)

    const count = computed(() => props.selectedCommitIds?.length || 0)

    const clear = () => emit('clear')
    const initMove = () => {
      showDialog.value = true
      dialogType.value = BatchActionType.Move
    }
    const initDelete = () => {
      showDialog.value = true
      dialogType.value = BatchActionType.Delete
    }
    const onFinish = () => {
      clear()
      emit('finish')
    }

    return { clear, count, showDialog, initMove, initDelete, onFinish, dialogType }
  }
})
</script>
