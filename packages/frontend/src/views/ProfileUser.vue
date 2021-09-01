<template>
  <!-- <v-container :fluid="$vuetify.breakpoint.mdAndDown"> -->
  <v-container :style="`${ !$vuetify.breakpoint.xsOnly ? 'padding-left: 56px;' : ''} max-width: 1024px;`" >
    <v-row v-if="$apollo.loading">
      <v-col cols="12">
        <v-skeleton-loader type="card, article"></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <user-info-card :user="user"></user-info-card>
      </v-col>
      <v-col cols="12" class="pt-10">
        <v-card class="mb-3 elevation-0">
          <v-card-title>
            {{ user.name }} and you share {{ user.streams.totalCount }}
            {{ user.streams.totalCount === 1 ? 'stream' : 'streams' }}. {{ user.name.split(' ')[0] }} has
            {{ user.commits.totalCount }}
            {{ user.commits.totalCount === 1 ? 'commit' : 'commits' }}.
          </v-card-title>
        </v-card>
        <v-row>
          <v-col v-for="(stream, i) in user.streams.items" :key="i" cols="12" sm="6" lg="4">
            <list-item-stream :stream="stream"></list-item-stream>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import UserInfoCard from '../components/UserInfoCard'
import ListItemStream from '../components/ListItemStream'
import gql from 'graphql-tag'

export default {
  name: 'ProfileUser',
  components: { UserInfoCard, ListItemStream },
  data: () => ({}),
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
  computed: {},
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
