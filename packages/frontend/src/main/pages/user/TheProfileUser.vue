<template>
  <v-container fluid class="pa-0">
    <prioritized-portal v-if="user" to="toolbar" identity="user-profile" :priority="1">
      Profile Page of {{ user.name }}
    </prioritized-portal>
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
import { AppLocalStorage } from '@/utils/localStorage'
import PrioritizedPortal from '@/main/components/common/utility/PrioritizedPortal.vue'

export default {
  name: 'TheProfileUser',
  components: {
    UserInfoCard: () => import('@/main/components/user/UserInfoCard'),
    SectionCard: () => import('@/main/components/common/SectionCard'),
    ListItemStream,
    PrioritizedPortal
  },
  apollo: {
    user: {
      query: gql`
        query User($id: String!) {
          otherUser(id: $id) {
            id
            name
            bio
            company
            avatar
            verified
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
      update: (data) => data.otherUser,
      variables() {
        return {
          id: this.$route.params.userId
        }
      }
    }
  },
  created() {
    // Move to self profile
    if (this.$route.params.userId === AppLocalStorage.get('uuid')) {
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
