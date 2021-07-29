<template>
  <v-row v-if="!error">
    <v-col v-if="$apollo.loading" cols="12">
      <v-skeleton-loader type="heading" class="mb-5"></v-skeleton-loader>
      <v-skeleton-loader type="text@3" class="mb-5"></v-skeleton-loader>
      <v-skeleton-loader type="list-item-two-line, image"></v-skeleton-loader>
    </v-col>
    <v-col v-if="stream" cols="12">
      <h1 class="display-1">{{ stream.name }}</h1>
      <h3 class="title font-italic font-weight-thin my-5">
        {{ truncate(stream.description) }}
      </h3>
      <div class="mb-3">
        <span class="caption">
          Created
          <timeago v-tooltip="formatDate(stream.createdAt)" :datetime="stream.createdAt"></timeago>
        </span>
        <span class="ml-3 caption">
          Updated
          <timeago v-tooltip="formatDate(stream.updatedAt)" :datetime="stream.updatedAt"></timeago>
        </span>
      </div>
      <div>
        <v-chip>
          <v-icon small left>mdi-source-branch</v-icon>

          {{ stream.branches.totalCount }}
          branch{{ stream.branches.totalCount === 1 ? '' : 'es' }}
        </v-chip>
        <v-chip class="ml-3">
          <v-icon small left>mdi-source-commit</v-icon>
          &nbsp;

          {{ stream.commits.totalCount }}
          commit{{ stream.commits.totalCount === 1 ? '' : 's' }}
        </v-chip>
        <v-chip class="ml-3">
          <span
            v-if="stream.isPublic"
            v-tooltip="`Anyone can view this stream. Only you and collaborators can edit it.`"
          >
            <v-icon small left>mdi-lock-open-variant-outline</v-icon>
            &nbsp; public
          </span>
          <span v-else v-tooltip="`Only collaborators can access this stream.`">
            <v-icon small left>mdi-lock-outline</v-icon>
            &nbsp; private
          </span>
        </v-chip>
        <v-chip v-if="loggedIn" class="ml-3">
          <v-icon small left>mdi-account-key-outline</v-icon>
          {{ stream.role.split(':')[1] }}
        </v-chip>
        <user-avatar
          v-for="collab in stream.collaborators"
          :id="collab.id"
          :key="collab.id"
          :size="30"
          :avatar="collab.avatar"
          :name="collab.name"
          class="ml-1"
        ></user-avatar>
      </div>
    </v-col>

    <no-data-placeholder v-if="!latestCommit" :message="'This Stream has no data yet.'" />

    <v-col v-else cols="12">
      <h3 class="title mb-3 mt-3">Last commit</h3>
      <v-card class="mb-4 transparent" rounded="lg" elevation="0">
        <v-list two-line class="pa-0">
          <v-list-item :to="'/streams/' + $route.params.streamId + '/commits/' + latestCommit.id">
            <v-list-item-icon>
              <user-avatar
                :id="latestCommit.authorId"
                :avatar="latestCommit.authorAvatar"
                :name="latestCommit.authorName"
                :size="30"
              />
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="mb-2 pt-1">
                <b>{{ latestCommit.message }}</b>
              </v-list-item-title>
              <v-list-item-subtitle class="caption">
                <b>{{ latestCommit.authorName }}</b>
                &nbsp;
                <timeago :datetime="latestCommit.createdAt"></timeago>
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-row align="center" justify="center">
                <v-chip small class="mr-2">
                  <v-icon small class="mr-2">mdi-source-branch</v-icon>
                  {{ latestCommit.branchName }}
                </v-chip>

                <source-app-avatar :application-name="latestCommit.sourceApplication" />
              </v-row>
            </v-list-item-action>
          </v-list-item>
        </v-list>

        <div style="height: 50vh">
          <renderer
            :object-url="latestCommitObjectUrl"
            :unload-trigger="clearRendererTrigger"
            show-selection-helper
          />
        </div>

        <v-sheet class="rounded-b-lg pa-3">
          <v-btn
            class="pa-3"
            color="primary"
            text
            block
            :to="'/streams/' + $route.params.streamId + '/commits/' + latestCommit.id"
          >
            <v-icon class="mr-2 float-left">mdi-source-commit</v-icon>
            See commit details
          </v-btn>
        </v-sheet>

        <no-data-placeholder v-if="!latestCommit" :message="`This branch has no commits.`" />
      </v-card>
    </v-col>
  </v-row>
  <v-row v-else justify="center">
    <v-col cols="12" class="pt-10">
      <error-block :message="error" />
    </v-col>
  </v-row>
</template>
<script>
import streamQuery from '@/graphql/stream.gql'
export default {
  name: 'Home',
  components: {
    UserAvatar: () => import('@/components/UserAvatar'),
    SourceAppAvatar: () => import('@/components/SourceAppAvatar'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    Renderer: () => import('@/components/Renderer'),
    ErrorBlock: () => import('@/components/ErrorBlock')
  },
  data() {
    return {
      clearRendererTrigger: 0,
      error: ''
    }
  },
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    }
  },
  computed: {
    latestCommit() {
      return this.stream ? this.stream.commits.items[0] : null
    },
    latestCommitObjectUrl() {
      if (!this.latestCommit) return null
      return `${window.location.origin}/streams/${this.$route.params.streamId}/objects/${this.latestCommit.referencedObject}`
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },

  methods: {
    truncate(input, length = 250) {
      if (!input) return ''
      if (input.length > length) {
        return input.substring(0, length) + '...'
      }
      return input
    },
    formatDate(d) {
      if (!this.stream) return null
      let date = new Date(d)
      let options = { year: 'numeric', month: 'short', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
