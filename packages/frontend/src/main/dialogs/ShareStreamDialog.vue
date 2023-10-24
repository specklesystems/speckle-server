<template>
  <v-dialog v-model="realShow" max-width="600" :fullscreen="$vuetify.breakpoint.xsOnly">
    <v-card>
      <v-sheet color="primary">
        <v-toolbar color="primary" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-share-variant</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Engage Multiplayer Mode!</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="mt-0 mb-0 px-2">
          <v-text-field
            ref="streamUrl"
            dark
            filled
            rounded
            hint="Stream url copied to clipboard. Use it in a connector, or just share it with colleagues!"
            style="color: blue"
            prepend-inner-icon="mdi-folder"
            :value="streamUrl"
            @focus="copyToClipboard"
          ></v-text-field>
          <v-text-field
            v-if="branchName"
            dark
            filled
            rounded
            hint="Branch url copied to clipboard. Most connectors can receive the latest commit from a branch by using this url."
            style="color: blue"
            prepend-inner-icon="mdi-source-branch"
            :value="streamUrl + '/branches/' + formatBranchNameForURL(branchName)"
            @focus="copyToClipboard"
          ></v-text-field>
          <v-text-field
            v-if="resourceId && $resourceType(resourceId) === 'commit'"
            dark
            filled
            rounded
            hint="Commit url copied to clipboard. Most connectors can receive a specific commit by using this url."
            style="color: blue"
            prepend-inner-icon="mdi-source-commit"
            :value="streamUrl + '/commits/' + resourceId"
            @focus="copyToClipboard"
          ></v-text-field>
          <v-text-field
            v-if="resourceId && $resourceType(resourceId) === 'object'"
            dark
            filled
            rounded
            hint="Object url copied to clipboard. Most connectors can receive a specific object by using this url."
            style="color: blue"
            prepend-inner-icon="mdi-cube-outline"
            :value="streamUrl + '/objects/' + resourceId"
            @focus="copyToClipboard"
          ></v-text-field>
        </v-card-text>
      </v-sheet>
      <v-sheet v-if="resourceId || true">
        <v-toolbar dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-camera</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Embed {{ embedType }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <span v-if="!stream?.isPublic" class="caption">
            Viewer embedding only works if link sharing is on.
          </span>
        </v-toolbar>
        <div v-if="stream?.isPublic">
          <v-card-text>
            <div class="caption mx-1 pb-2">
              Copy the code below to embed an iframe of
              <b>{{ embedDescription }}</b>
              in your webpage or document.
            </div>
            <div class="d-flex align-center mt-4">
              <v-text-field
                dense
                :value="iFrameUrl"
                hint="Copied to clipboard!"
                filled
                rounded
                @focus="copyToClipboard"
              ></v-text-field>
            </div>
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-header>Embed Options</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-checkbox
                    v-model="transparent"
                    class="ml-2 caption"
                    label="Transparent background"
                    dense
                  ></v-checkbox>
                  <v-checkbox
                    v-model="hideControls"
                    class="ml-2 caption"
                    label="Hide viewer controls"
                    dense
                  ></v-checkbox>
                  <v-checkbox
                    v-model="hideSidebar"
                    dense
                    class="ml-2 caption"
                    label="Hide viewer sidebar (filters, views, etc.)"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="hideSelectionInfo"
                    dense
                    class="ml-2 caption"
                    label="Hide object selection info"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="noScroll"
                    dense
                    class="ml-2 caption"
                    label="Prevent scrolling (zooming)"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="autoload"
                    dense
                    class="ml-2 caption"
                    label="Load model automatically"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="commentSlideshow"
                    dense
                    class="ml-2 caption"
                    label="Comment slideshow mode"
                  ></v-checkbox>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </div>
      </v-sheet>
      <v-sheet
        v-if="stream"
        :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : 'grey darken-4'}`"
      >
        <v-toolbar
          v-if="stream.role === streamRoles.Owner"
          class="transparent"
          rounded
          flat
        >
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>{{ stream.isPublic ? 'mdi-lock-open' : 'mdi-lock' }}</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>
            {{ stream.isPublic ? 'Link Sharing On' : 'Link Sharing Off' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-switch
            :input-value="stream.isPublic"
            inset
            class="mt-4"
            :loading="swapPermsLoading"
            :disabled="swapPermsLoading"
            @click="changeVisibility"
          />
        </v-toolbar>
        <v-card-text v-if="stream.isPublic" class="pt-2">
          Link sharing is on. This means that anyone with the link can view this stream.
          Only collaborators will be able to send or edit data.
        </v-card-text>
        <v-card-text v-if="!stream.isPublic" class="pt-2 pb-2">
          Link sharing is off. This means that only collaborators can view or edit this
          stream.
        </v-card-text>
      </v-sheet>
      <v-sheet v-if="stream?.collaborators?.length">
        <v-toolbar
          v-tooltip="
            `${
              stream.role !== streamRoles.Owner
                ? 'You do not have the right access level (' +
                  stream.role +
                  ') to add collaborators.'
                : ''
            }`
          "
          flat
        >
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-account-group</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>
            Collaborators
            <user-avatar
              v-for="collab in stream.collaborators.slice(
                0,
                stream.collaborators.length > 5 ? 4 : 5
              )"
              :id="collab.id"
              :key="collab.id"
              :size="20"
              :avatar="collab.avatar"
              :name="collab.name"
            ></user-avatar>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            rounded
            :disabled="stream.role !== streamRoles.Owner"
            @click="goToStreamCollabs()"
          >
            Manage
          </v-btn>
        </v-toolbar>
      </v-sheet>
      <v-sheet
        v-if="stream"
        :xxxclass="`${!$vuetify.theme.dark ? 'grey lighten-4' : 'grey darken-4'}`"
      >
        <v-toolbar
          v-if="!stream.isPublic"
          v-tooltip="
            `${
              stream.role !== streamRoles.Owner
                ? 'You do not have the right access level (' +
                  stream.role +
                  ') to invite people to this stream.'
                : ''
            }`
          "
          flat
          class="transparent"
        >
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-email</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Missing someone?</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            rounded
            :disabled="stream.role !== streamRoles.Owner"
            @click="showStreamInviteDialog()"
          >
            Send Invite
          </v-btn>
        </v-toolbar>
        <invite-dialog :stream-id="streamId" :visible.sync="inviteDialogVisible" />
      </v-sheet>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import InviteDialog from '@/main/dialogs/InviteDialog.vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'
import { useEmbedViewerUrlManager } from '@/main/lib/viewer/commit-object-viewer/composables/embed'
import { computed, PropType } from 'vue'
import { useRoute } from '@/main/lib/core/composables/router'
import { getResourceType } from '@/main/lib/viewer/core/helpers/resourceHelper'
import { EmbedParams } from '@/main/lib/viewer/commit-object-viewer/services/embed'
import { ensureError } from '@/main/lib/common/general/helpers/errorHelper'
import {
  ShareableStreamDocument,
  UpdateStreamSettingsDocument
} from '@/graphql/generated/graphql'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { Optional, Roles } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

/**
 * what about embedType? can that be cleaned up? and all other url params?
 * can we add embed button back to embed viewer then?
 */

export default {
  name: 'ShareStreamDialog',
  components: {
    UserAvatar,
    InviteDialog
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    streamId: {
      type: String,
      required: true
    },
    branchName: {
      type: String as PropType<Optional<string>>,
      default: () => undefined
    },
    resourceId: {
      type: String as PropType<Optional<string>>,
      default: () => undefined
    }
  },
  setup(props, { emit }) {
    const realShow = computed({
      get: () => props.show,
      set: (newVal) => {
        emit('update:show', !!newVal)
        if (!newVal) {
          resetUrlOptions()
        }
      }
    })

    const route = useRoute()
    const resourceType = computed(() =>
      props.resourceId ? getResourceType(props.resourceId) : ''
    )
    const objectId = computed(() =>
      resourceType.value === 'object' ? props.resourceId : undefined
    )
    const commitId = computed(() =>
      resourceType.value === 'commit' ? props.resourceId : undefined
    )

    const { result: streamResult } = useQuery(ShareableStreamDocument, () => ({
      id: props.streamId
    }))
    const stream = computed(() => streamResult.value?.stream)

    const embedParams = computed(
      (): EmbedParams => ({
        streamId: props.streamId,
        branchName: props.branchName,
        objectId: objectId.value,
        commitId: commitId.value,
        overlay: (route.query.overlay as string) || undefined,
        c: (route.query.c as string) || undefined,
        filter: (route.query.filter as string) || undefined
      })
    )

    const {
      options,
      url,
      iFrameUrl,
      resetOptions: resetUrlOptions
    } = useEmbedViewerUrlManager({
      embedParams
    })

    return {
      realShow,
      stream,
      resourceType,
      objectId,
      commitId,
      ...options,
      url,
      iFrameUrl,
      resetUrlOptions,
      streamRoles: Roles.Stream,
      formatBranchNameForURL
    }
  },
  data() {
    return {
      swapPermsLoading: false,
      inviteDialogVisible: false
    }
  },
  computed: {
    streamUrl() {
      return `${window.location.origin}/streams/${this.streamId}`
    },
    embedType() {
      if (this.branchName) return 'Branch'
      if (this.resourceId) return 'Model'
      return 'Stream'
    },
    embedDescription() {
      if (this.branchName) return 'the latest commit in this branch'
      if (this.resourceId) return 'model'
      return 'the latest commit in this stream'
    }
  },
  mounted() {
    this.$mixpanel.track('Share Stream', {
      type: 'action',
      location: this.$route.name
    })
  },
  methods: {
    closeDialog() {
      this.resetUrlOptions()
      this.realShow = false
    },
    copyToClipboard(e: MouseEvent) {
      const target = e.target as HTMLInputElement
      target.select()
      document.execCommand('copy')
    },
    goToStreamCollabs() {
      this.$router.push(`/streams/${this.streamId}/collaborators`)
      this.closeDialog()
    },
    showStreamInviteDialog() {
      this.inviteDialogVisible = true
    },
    async changeVisibility() {
      if (!this.stream) return

      const stream = this.stream
      this.swapPermsLoading = true

      const newIsPublic = !stream.isPublic
      try {
        await this.$apollo
          .mutate({
            mutation: UpdateStreamSettingsDocument,
            variables: {
              input: {
                id: this.streamId,
                isPublic: newIsPublic
              }
            },
            optimisticResponse: {
              __typename: 'Mutation',
              streamUpdate: newIsPublic
            },
            update: (cache, { data }) => {
              const isSuccess = !!data?.streamUpdate
              if (!isSuccess) return

              // Update stream public value in cache
              cache.modify({
                id: cache.identify(stream),
                fields: {
                  isPublic: () => newIsPublic
                }
              })
            }
          })
          .catch(convertThrowIntoFetchResult)
      } catch (e: unknown) {
        this.$triggerNotification({
          text: ensureError(e, 'Something went wrong').message,
          type: 'error'
        })
      }
      this.swapPermsLoading = false
    }
  }
}
</script>
