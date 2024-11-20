<template>
  <base-dialog :show.sync="realShow">
    <template #title>
      {{ titleText }}
    </template>
    <template #content>
      <template v-if="type === BatchActionType.Delete">
        Deleting commits is an irrevocable action! If you are sure about wanting to
        delete the selected commits, please click on the button below!
      </template>
      <template
        v-else-if="
          type === BatchActionType.Move && supportsBranchScopedActions && streamId
        "
      >
        <div class="mb-4">
          Please select the target branch to move all of the selected commits to:
        </div>
        <branch-select
          v-model="targetBranch"
          :stream-id="streamId"
          :excluded-names="branchName ? [branchName] : []"
        />
      </template>
    </template>
    <template #actions>
      <v-spacer></v-spacer>
      <v-btn @click="close">Cancel</v-btn>
      <template v-if="type === BatchActionType.Delete">
        <v-btn color="red" :disabled="deleteDisabled" @click="deleteCommits">
          Delete
        </v-btn>
      </template>
      <template
        v-else-if="type === BatchActionType.Move && supportsBranchScopedActions"
      >
        <v-btn color="primary" :disabled="moveDisabled" @click="moveCommits">
          Move
        </v-btn>
      </template>
    </template>
  </base-dialog>
</template>
<script lang="ts">
import BaseDialog from '@/main/components/common/layout/BaseDialog.vue'
import BranchSelect from '@/main/components/stream/branch/BranchSelect.vue'
import { BatchActionType } from '@/main/lib/stream/composables/commitMultiActions'
import { useApolloClient } from '@vue/apollo-composable'
import { computed, defineComponent, PropType, ref } from 'vue'
import {
  MoveCommitsDocument,
  DeleteCommitsDocument,
  MoveCommitsMutation,
  MoveCommitsMutationVariables,
  DeleteCommitsMutation,
  DeleteCommitsMutationVariables
} from '@/graphql/generated/graphql'
import { Nullable, Optional } from '@/helpers/typeHelpers'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { useGlobalToast } from '@/main/lib/core/composables/notifications'
import { DocumentNode } from 'graphql'
import type { OperationVariables } from '@apollo/client/core'

export default defineComponent({
  name: 'CommitsBatchActionsDialog',
  components: {
    BaseDialog,
    BranchSelect
  },
  props: {
    streamId: {
      type: String as PropType<Optional<string>>,
      default: undefined
    },
    branchName: {
      type: String as PropType<Optional<string>>,
      default: undefined
    },
    selectedCommitIds: {
      type: Array as PropType<string[]>,
      required: true
    },
    show: {
      type: Boolean,
      required: true
    },
    type: {
      type: String as PropType<BatchActionType>,
      default: BatchActionType.Delete
    }
  },
  setup(props, { emit }) {
    const apollo = useApolloClient().client
    const { triggerNotification } = useGlobalToast()

    const supportsBranchScopedActions = computed(
      () => props.streamId && props.branchName
    )

    const targetBranch = ref(null as Nullable<string>)
    const loading = ref(false)

    const realShow = computed({
      get: () => props.show,
      set: (newShow) => emit('update:show', newShow)
    })
    const count = computed(() => props.selectedCommitIds.length)
    const titleText = computed(() => {
      switch (props.type) {
        case BatchActionType.Delete:
          return `Delete ${count.value} commits`
        case BatchActionType.Move:
          return `Move ${count.value} commits`
        default:
          return ''
      }
    })
    const moveDisabled = computed(() => !targetBranch.value || loading.value)
    const deleteDisabled = computed(() => loading.value)

    const close = () => (realShow.value = false)

    const invokeAction = async <
      D = Record<string, unknown>,
      V extends OperationVariables = Record<string, unknown>
    >(params: {
      shouldQuit: () => boolean
      getResult: (data: D | undefined) => boolean | null | undefined
      document: DocumentNode
      variables: V
      successMessage: string
    }) => {
      const { shouldQuit, document, variables, getResult, successMessage } = params
      if (shouldQuit()) return

      loading.value = true
      const { data, errors } = await apollo
        .mutate({
          mutation: document,
          variables
        })
        .catch(convertThrowIntoFetchResult)

      const result = getResult(data)
      if (result) {
        triggerNotification({
          text: successMessage,
          type: 'success'
        })

        // finished
        close()
        emit('finish', { type: props.type, variables })
      } else {
        const msg = getFirstErrorMessage(errors)
        triggerNotification({
          text: msg,
          type: 'error'
        })
      }

      loading.value = false
    }

    const moveCommits = async () => {
      await invokeAction<MoveCommitsMutation, MoveCommitsMutationVariables>({
        shouldQuit: () => !supportsBranchScopedActions.value || moveDisabled.value,
        getResult: (data) => data?.commitsMove,
        document: MoveCommitsDocument,
        variables: {
          input: {
            streamId: props.streamId,
            commitIds: props.selectedCommitIds.slice(),
            targetBranch: targetBranch.value!
          }
        },
        successMessage: 'Selected commits successfully moved'
      })
    }

    const deleteCommits = async () => {
      await invokeAction<DeleteCommitsMutation, DeleteCommitsMutationVariables>({
        shouldQuit: () => deleteDisabled.value,
        getResult: (data) => data?.commitsDelete,
        document: DeleteCommitsDocument,
        variables: {
          input: {
            streamId: props.streamId,
            commitIds: props.selectedCommitIds.slice()
          }
        },
        successMessage: 'Selected commits successfully deleted'
      })
    }

    return {
      realShow,
      count,
      titleText,
      BatchActionType,
      close,
      moveCommits,
      deleteCommits,
      targetBranch,
      moveDisabled,
      deleteDisabled,
      supportsBranchScopedActions
    }
  }
})
</script>
