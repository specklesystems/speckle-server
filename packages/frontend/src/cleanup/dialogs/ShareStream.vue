<template>
  <v-card>
    <v-sheet color="primary">
      <v-toolbar color="primary" dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-share-variant</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>Engage Multiplayer Mode!</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
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
          v-if="$route.params.branchName"
          ref="branchUrl"
          dark
          filled
          rounded
          hint="Branch url copied to clipboard. Most connectors can receive the latest commit from a branch by using this url."
          style="color: blue"
          prepend-inner-icon="mdi-source-branch"
          :value="streamUrl + '/branches/' + $route.params.branchName"
          @focus="copyToClipboard"
        ></v-text-field>
        <v-text-field
          v-if="$route.params.resourceId && $route.params.resourceId.length === 10"
          ref="commitUrl"
          dark
          filled
          rounded
          hint="Commit url copied to clipboard. Most connectors can receive a specific commit by using this url."
          style="color: blue"
          prepend-inner-icon="mdi-source-commit"
          :value="streamUrl + '/commits/' + $route.params.resourceId"
          @focus="copyToClipboard"
        ></v-text-field>
        <v-text-field
          v-if="$route.params.resourceId && $route.params.resourceId.length !== 10"
          ref="commitUrl"
          dark
          filled
          rounded
          hint="Object url copied to clipboard. Most connectors can receive a specific object by using this url."
          style="color: blue"
          prepend-inner-icon="mdi-cube-outline"
          :value="streamUrl + '/objects/' + $route.params.resourceId"
          @focus="copyToClipboard"
        ></v-text-field>
      </v-card-text>
    </v-sheet>
    <v-sheet v-if="$route.params.resourceId">
      <v-toolbar dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-camera</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>Embed Viewer</v-toolbar-title>
        <v-spacer></v-spacer>
        <span v-if="!stream.isPublic" class="caption">
          Viewer embedding only works if the stream is public.
        </span>
      </v-toolbar>
      <div v-if="stream.isPublic">
        <v-card-text>
          <div class="caption mx-1 pb-2">
            Copy the code below to embed an iframe of this model in your webpage or document.
          </div>
          <v-text-field
            dense
            :value="getIframeUrl()"
            hint="Copied to clipboard!"
            filled
            rounded
            @focus="copyToClipboard"
          ></v-text-field>
        </v-card-text>
      </div>
    </v-sheet>
    <v-sheet v-if="stream" :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : 'grey darken-4'}`">
      <v-toolbar v-if="stream.role === 'stream:owner'" class="transparent" rounded flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>{{ stream.isPublic ? 'mdi-lock-open' : 'mdi-lock' }}</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>
          {{ stream.isPublic ? 'Public stream' : 'Private stream' }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-switch
          v-model="stream.isPublic"
          inset
          class="mt-4"
          :loading="swapPermsLoading"
          @click="changeVisibility"
        ></v-switch>
      </v-toolbar>
      <v-card-text v-if="stream.isPublic" class="pt-2">
        This stream is public. This means that anyone with the link can view and read data from it.
      </v-card-text>
      <v-card-text v-if="!stream.isPublic" class="pt-2 pb-2">
        This stream is private. This means that only collaborators can access it.
      </v-card-text>
    </v-sheet>
    <v-sheet v-if="stream">
      <v-toolbar
        v-tooltip="
          `${
            stream.role !== 'stream:owner'
              ? 'You do not have the right access level (' + stream.role + ') to add collaborators.'
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
            v-for="collab in stream.collaborators.slice(0, stream.collaborators.length > 5 ? 4 : 5)"
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
          :to="`/streams/${$route.params.streamId}/collaborators`"
          :disabled="stream.role !== 'stream:owner'"
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
            stream.role !== 'stream:owner'
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
          :disabled="stream.role !== 'stream:owner'"
          @click="showStreamInviteDialog()"
        >
          Send Invite
        </v-btn>
      </v-toolbar>
    </v-sheet>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
export default {
  components: {
    UserAvatar: () => import('@/components/UserAvatar')
  },
  props: ['stream'],
  data() {
    return {
      swapPermsLoading: false
    }
  },
  computed: {
    streamUrl() {
      return `${window.location.origin}/streams/${this.$route.params.streamId}`
    }
  },
  mounted() {
    this.$mixpanel.track('Share Stream', {
      type: 'action',
      location: this.$route.name
    })
  },
  methods: {
    copyToClipboard(e) {
      // this.$clipboard(e.target.value)
      // console.log(e.target.value)
      e.target.select()
      document.execCommand('copy')
    },
    getIframeUrl() {
      let resourceId = this.$route.params.resourceId
      if (!resourceId) return null
      let base = `${window.location.origin}/embed?stream=${this.$route.params.streamId}`
      return `<iframe src="${base}&${resourceId.length === 10 ? 'commit' : 'object'}=${
        this.$route.params.resourceId
      }" width=600 height=400 />"`
    },
    async changeVisibility() {
      this.swapPermsLoading = true
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation editDescription($input: StreamUpdateInput!) {
              streamUpdate(stream: $input)
            }
          `,
          variables: {
            input: {
              id: this.$route.params.streamId,
              isPublic: this.stream.isPublic
            }
          }
        })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message ? e.message : 'Something went wrong.'
        })
        this.stream.isPublic = !this.stream.isPublic
      }
      this.swapPermsLoading = false
      this.$emit('visibility-change')
      // this.$apollo.queries.stream.refetch()
    }
  }
}
</script>
