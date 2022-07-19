<template>
  <v-container fluid class="pa-0">
    <portal v-if="canRenderToolbarPortal && user" to="toolbar">
      Profile Page of {{ user.name }}
    </portal>
    <v-row v-if="$apollo.loading">
      <v-col cols="12">
        <v-skeleton-loader type="card, article"></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12" md="4">
        <user-info-card :user="user"></user-info-card>
      </v-col>
      <v-col cols="12" md="8">
        <section-card expandable :expand="false">
          <template #header>
            {{ user.name }} and you share {{ user.streams.totalCount }}
            {{ user.streams.totalCount === 1 ? 'stream' : 'streams' }}.
            {{ user.name.split(' ')[0] }} has
            {{ user.commits.totalCount }}
            {{ user.commits.totalCount === 1 ? 'commit' : 'commits' }}.
          </template>
          <v-card-text>
            <v-row class="mt-2">
              <v-col
                v-for="(stream, i) in user.streams.items"
                :key="i"
                cols="12"
                sm="6"
                lg="4"
              >
                <list-item-stream :stream="stream"></list-item-stream>
              </v-col>
            </v-row>
          </v-card-text>
        </section-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import ListItemStream from '@/main/components/user/ListItemStream'
import { gql } from '@apollo/client/core'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  name: 'TheProfileUser',
  components: {
    UserInfoCard: () => import('@/main/components/user/UserInfoCard'),
    SectionCard: () => import('@/main/components/common/SectionCard'),
    ListItemStream
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'user-profile', 1)],
  apollo: {
    user: {
      query: gql`
        query User($id: String!) {
          user(id: $id) {
            id
            email
            name
            bio
            company
            avatar
            verified
            profiles
            role
            suuid
            totalOwnedStreamsFavorites
            streams {
              totalCount
              items {
                id
                description
                updatedAt
                name
              }
            }
            commits {
              totalCount
            }
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.userId
        }
      }
    }
  },
  created() {
    // Move to self profile
    if (this.$route.params.userId === localStorage.getItem('uuid')) {
      this.$router.replace({ path: '/profile' })
    }
  },
  methods: {}
}
</script>
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
