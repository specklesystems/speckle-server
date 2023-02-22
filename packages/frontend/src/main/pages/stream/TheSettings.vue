<template>
  <v-container class="pa-0">
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      <div v-if="stream" class="d-flex align-center">
        <div class="text-truncate">
          <router-link
            v-tooltip="stream.name"
            class="text-decoration-none space-grotesk mx-1"
            :to="`/streams/${stream.id}`"
          >
            <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
            <b>{{ stream.name }}</b>
          </router-link>
        </div>
        <div class="text-truncate flex-shrink-0">
          /
          <v-icon small class="mr-2 mb-1 hidden-xs-only">mdi-cog</v-icon>
          <span class="space-grotesk">Settings</span>
        </div>
      </div>
    </portal>
    <v-row v-if="stream">
      <v-col v-if="isEditNotAuthorized" cols="12">
        <v-alert type="warning">
          Your permission level ({{ stream.role ? stream.role : 'none' }}) is not high
          enough to edit this stream's details.
        </v-alert>
      </v-col>
      <v-col cols="12">
        <section-card>
          <template #header>
            <v-icon class="mr-2" small>mdi-cog</v-icon>
            <span class="d-inline-block">General</span>
          </template>
          <v-card-text>
            <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="save">
              <h2>Name and description</h2>
              <v-text-field
                v-model="model.name"
                :rules="validation.nameRules"
                label="Name"
                hint="The name of this stream."
                class="mt-5"
                :disabled="isEditDisabled"
              />
              <v-text-field
                v-model="model.description"
                label="Description"
                hint="The description of this stream."
                class="mt-5"
                :disabled="isEditDisabled"
              />
              <h2>Privacy</h2>
              <stream-visibility-toggle
                :disabled="isEditDisabled"
                :is-public.sync="model.isPublic"
                :is-discoverable.sync="model.isDiscoverable"
              />
              <br />
              <h2>Comments</h2>
              <v-switch
                v-model="model.allowPublicComments"
                inset
                class="mt-5"
                :label="
                  model.allowPublicComments
                    ? 'Anyone can comment'
                    : 'Only collaborators can comment'
                "
                :hint="
                  model.allowPublicComments
                    ? 'Any signed in user can leave a comment; the stream needs to be public.'
                    : 'Only collaborators can comment.'
                "
                persistent-hint
                :disabled="isEditDisabled"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn
              class="ml-3"
              color="primary"
              type="submit"
              :disabled="!canSave"
              block
              @click="save"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </section-card>
      </v-col>
      <v-col v-if="!isEditNotAuthorized" cols="12">
        <section-card :expand="true">
          <template #header>Danger Zone</template>

          <v-card-text class="d-flex align-center">
            <div>
              <v-btn
                color="error"
                fab
                dark
                small
                :disabled="isEditDisabled"
                @click="deleteDialog = true"
              >
                <v-icon>mdi-delete-forever</v-icon>
              </v-btn>
            </div>
            <div class="ml-4">
              <div class="text-subtitle-1">Permanently Delete Stream</div>
              <div class="caption">
                Once you delete a stream, there is no going back! All data will be
                removed, and existing collaborators will not be able to access it.
              </div>
            </div>
          </v-card-text>
        </section-card>
        <v-dialog
          v-model="deleteDialog"
          width="500"
          @keydown.esc="deleteDialog = false"
        >
          <v-card>
            <v-toolbar class="error mb-4">
              <v-toolbar-title>Deleting Stream '{{ stream.name }}'</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-toolbar-items>
                <v-btn icon @click="deleteDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar-items>
            </v-toolbar>

            <v-card-text>
              Type the name of the stream below to confirm you really want to delete it.
              All data will be removed, and existing collaborators will not be able to
              access it.
              <v-divider class="my-2"></v-divider>
              <b>You cannot undo this action.</b>

              <v-text-field
                v-model="streamNameConfirm"
                label="Confirm stream name"
                class="pt-10"
              ></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn
                block
                class="mr-3"
                color="error"
                :disabled="streamNameConfirm !== stream.name"
                @click="deleteStream"
              >
                delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { STANDARD_PORTAL_KEYS, usePortalState } from '@/main/utils/portalStateManager'
import SectionCard from '@/main/components/common/SectionCard.vue'
import StreamVisibilityToggle from '@/main/components/stream/editor/StreamVisibilityToggle.vue'
import { required } from '@/main/lib/common/vuetify/validators'
import { computed, defineComponent, ref, watch } from 'vue'
import { Nullable } from '@/helpers/typeHelpers'
import {
  StreamSettingsDocument,
  StreamSettingsQuery,
  UpdateStreamSettingsDocument,
  DeleteStreamDocument
} from '@/graphql/generated/graphql'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { useRoute, useRouter } from '@/main/lib/core/composables/router'
import type { Get } from 'type-fest'
import { debounce } from 'lodash'
import { Roles } from '@/helpers/mainConstants'
import { useMixpanel } from '@/main/lib/core/composables/core'
import { useGlobalToast } from '@/main/lib/core/composables/notifications'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '@/main/lib/common/apollo/helpers/apolloOperationHelper'

type ModelType = {
  name: string
  description: Nullable<string>
  isPublic: boolean
  isDiscoverable: boolean
  allowPublicComments: boolean
}

type StreamType = Get<StreamSettingsQuery, 'stream'>

export default defineComponent({
  name: 'TheSettings',
  components: {
    SectionCard,
    StreamVisibilityToggle
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const mixpanel = useMixpanel()
    const apollo = useApolloClient().client
    const { triggerNotification } = useGlobalToast()

    const { canRenderToolbarPortal } = usePortalState(
      [STANDARD_PORTAL_KEYS.Toolbar],
      'stream-settings',
      1
    )

    const buildModelFromStream = (stream: StreamType): ModelType => {
      if (!stream)
        return {
          name: '',
          description: null,
          isPublic: true,
          isDiscoverable: false,
          allowPublicComments: true
        }

      return {
        name: stream.name,
        description: stream.description || '',
        isPublic: stream.isPublic,
        isDiscoverable: stream.isDiscoverable,
        allowPublicComments: stream.allowPublicComments
      }
    }

    const save = async () => {
      if (!stream.value || !canSave.value) return

      const streamId = stream.value.id
      loading.value = true
      mixpanel.track('Stream Action', { type: 'action', name: 'update' })

      const result = await apollo
        .mutate({
          mutation: UpdateStreamSettingsDocument,
          variables: {
            input: {
              id: streamId,
              ...model.value
            }
          },
          update: (cache, { data }) => {
            if (!data?.streamUpdate) return

            updateCacheByFilter(
              cache,
              {
                query: {
                  query: StreamSettingsDocument,
                  variables: { id: streamId }
                }
              },
              (res) => {
                if (!res.stream) return

                return {
                  ...res,
                  stream: {
                    ...res.stream,
                    ...model.value
                  }
                }
              }
            )
          }
        })
        .catch(convertThrowIntoFetchResult)

      if (result.data?.streamUpdate) {
        triggerNotification({ text: 'Stream updated' })
      } else {
        triggerNotification({
          text: getFirstErrorMessage(result.errors),
          type: 'error'
        })
      }

      loading.value = false
    }

    const deleteStream = async () => {
      if (!stream.value || isEditDisabled.value) return

      mixpanel.track('Stream Action', { type: 'action', name: 'delete' })
      loading.value = true
      const streamId = stream.value.id

      const result = await apollo
        .mutate({
          mutation: DeleteStreamDocument,
          variables: {
            id: streamId
          },
          update: (cache, { data }) => {
            if (!data?.streamDelete) return

            cache.evict({
              id: getCacheId('Stream', streamId)
            })
          }
        })
        .catch(convertThrowIntoFetchResult)

      if (result.data?.streamDelete) {
        triggerNotification({
          text: 'Stream deleted.'
        })
      } else {
        triggerNotification({
          text: getFirstErrorMessage(result.errors),
          type: 'error'
        })
      }

      loading.value = false
      deleteDialog.value = false
      router.push({ path: '/streams?refresh=true' })
    }

    const model = ref<ModelType>({
      name: '',
      description: null,
      isPublic: true,
      isDiscoverable: false,
      allowPublicComments: true
    })
    const snackbar = ref(false)
    const loading = ref(false)
    const valid = ref(false)
    const deleteDialog = ref(false)
    const streamNameConfirm = ref('')
    const validation = {
      nameRules: [required('A stream must have a name!')]
    }

    const { result: streamSettingsResult } = useQuery(StreamSettingsDocument, () => ({
      id: route.params.streamId as string
    }))

    const stream = computed(
      (): StreamType => streamSettingsResult.value?.stream || null
    )
    const oldModel = computed(() => buildModelFromStream(stream.value))
    const isEditNotAuthorized = computed(
      () => stream.value?.role !== Roles.Stream.Owner
    )
    const isEditDisabled = computed(() => isEditNotAuthorized.value || loading.value)
    const changesExist = computed(() => {
      const keys = Object.keys(model.value) as Array<keyof ModelType>
      for (const key of keys) {
        const oldVal = oldModel.value[key]
        const newVal = model.value[key]

        if (oldVal !== newVal) return true
      }

      return false
    })
    const canSave = computed(
      () => !isEditDisabled.value && valid.value && changesExist.value
    )

    // re-init form when stream refreshed
    watch(
      stream,
      (newStream) => {
        model.value = buildModelFromStream(newStream)
      },
      { immediate: true }
    )

    // if public comments enabled, enable isPublic as well
    watch(
      () => model.value.allowPublicComments,
      (allowComments) => {
        if (allowComments && !model.value.isPublic) model.value.isPublic = true
      }
    )

    // if isPublic disabled, disabled allowPublicComments as well
    watch(
      () => model.value.isPublic,
      (isPublic) => {
        if (!isPublic && model.value.allowPublicComments)
          model.value.allowPublicComments = false
      }
    )

    // auto-save
    watch(
      model,
      debounce(() => {
        save()
      }, 1000),
      { deep: true }
    )

    return {
      canRenderToolbarPortal,
      stream,
      model,
      buildModelFromStream,
      snackbar,
      loading,
      valid,
      deleteDialog,
      streamNameConfirm,
      validation,
      changesExist,
      oldModel,
      canSave,
      isEditNotAuthorized,
      isEditDisabled,
      save,
      deleteStream
    }
  }
})
</script>
