<template>
  <basic-panel class="stream-access-request-banner">
    <div class="d-flex flex-column flex-md-row align-center">
      <div class="flex-grow-1 d-flex align-center">
        <user-avatar
          :id="requester.id"
          :name="requester.name"
          :avatar="requester.avatar"
          :size="25"
          class="mr-1"
        />
        <div>
          <strong>{{ requester.name }}</strong>
          has requested access to this stream
        </div>
      </div>
      <div class="d-flex align-center mt-2 mt-md-0">
        <v-select
          v-model="selectedRole"
          class="mr-2"
          filled
          rounded
          dense
          hide-details
          :items="availableRolesSelectItems"
          style="max-width: 200px"
        ></v-select>
        <v-btn
          small
          color="primary"
          class="mr-2 flex-grow-1 flex-md-grow-0"
          @click="approveRequest"
        >
          Add
        </v-btn>
        <v-btn
          small
          color="error"
          dark
          class="flex-grow-1 flex-md-grow-0"
          @click="declineRequest"
        >
          Ignore
        </v-btn>
      </div>
    </div>
  </basic-panel>
</template>
<script setup lang="ts">
import { computed, PropType, ref } from 'vue'
import type { Get } from 'type-fest'
import {
  StreamRole,
  StreamWithCollaboratorsQuery,
  UseStreamAccessRequestDocument,
  StreamPendingAccessRequestsFragment
} from '@/graphql/generated/graphql'
import BasicPanel from '@/main/components/common/layout/BasicPanel.vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import { Roles, streamRoleToGraphQLEnum } from '@/helpers/mainConstants'
import { useApolloClient } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  updateCacheByFilter,
  getCacheId
} from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { useEventHub } from '@/main/lib/core/composables/core'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { useGlobalToast } from '@/main/lib/core/composables/notifications'
import { streamPendingAccessRequestsFragment } from '@/graphql/fragments/streams'

type StreamAccessRequest = NonNullable<
  Get<StreamWithCollaboratorsQuery, 'stream.pendingAccessRequests.0'>
>

const props = defineProps({
  /**
   * Request from the StreamWithCollaborators query
   */
  request: {
    type: Object as PropType<StreamAccessRequest>,
    required: true
  }
})

const availableRolesSelectItems: { text: string; value: StreamRole }[] = Object.entries(
  Roles.Stream
).map(([text, value]) => ({
  text,
  value: streamRoleToGraphQLEnum(value)
}))
const selectedRole = ref<StreamRole>(streamRoleToGraphQLEnum(Roles.Stream.Contributor))

const requester = computed(() => props.request.requester)

const apollo = useApolloClient().client
const eventHub = useEventHub()
const { triggerNotification } = useGlobalToast()

/**
 * Accept or decline the access request
 */
const processRequest = async (accept: boolean) => {
  const reqId = props.request.id

  const res = await apollo
    .mutate({
      mutation: UseStreamAccessRequestDocument,
      variables: {
        requestId: reqId,
        accept,
        role: accept ? selectedRole.value : undefined
      },
      update: (cache, res) => {
        const reqId = props.request.id
        const streamId = props.request.streamId

        const { data } = res
        if (!data?.streamAccessRequestUse) return

        // Remove request from cache
        updateCacheByFilter<StreamPendingAccessRequestsFragment>(
          cache,
          {
            fragment: {
              id: getCacheId('Stream', streamId),
              // (not using typed doc, cause of nested fragments which don't get converted to typed doc correctly)
              fragment: streamPendingAccessRequestsFragment,
              fragmentName: 'StreamPendingAccessRequests'
            }
          },
          (data) => {
            if (!data.pendingAccessRequests?.length) return
            return {
              ...data,
              pendingAccessRequests: data.pendingAccessRequests.filter(
                (r) => r.id !== reqId
              )
            }
          }
        )
      }
    })
    .catch(convertThrowIntoFetchResult)

  const { data, errors } = res
  if (data?.streamAccessRequestUse) {
    triggerNotification({
      text: accept ? 'Access request approved' : 'Access request declined'
    })
  } else {
    triggerNotification({
      type: 'error',
      text: getFirstErrorMessage(errors)
    })
  }

  if (accept) {
    // reload stream collaborators
    eventHub.$emit(StreamEvents.RefetchCollaborators)
  }
}

const declineRequest = async () => {
  await processRequest(false)
}
const approveRequest = async () => {
  await processRequest(true)
}
</script>
<style lang="scss" scoped>
.stream-access-request-banner:not(:last-child) {
  margin-bottom: 16px !important;
}
</style>
