<template lang="html">
  <v-container v-if="$apollo.loading" fluid>
    <v-skeleton-loader type="article"></v-skeleton-loader>
  </v-container>

  <v-container v-else-if="isAdmin" class="pa-0">
    <admin-nav />
    <portal to="actions"><div></div></portal>
    <v-container fluid class="pa-0">
      <transition name="fade">
        <router-view></router-view>
      </transition>
    </v-container>
  </v-container>
  <v-container v-else-if="!isAdmin">
    <error-placeholder error-type="access">
      <h2>Only server admins have access to this section.</h2>
    </error-placeholder>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'AdminPanel',
  components: {
    ErrorPlaceholder: () => import('@/cleanup/components/common/ErrorPlaceholder'),
    AdminNav: () => import('@/cleanup/navigation/AdminNav')
  },
  data() {
    return {
      adminNav: true
    }
  },
  apollo: {
    user: {
      query: gql`
        query {
          user {
            role
            id
          }
        }
      `,
      prefetch: true
    }
  },
  computed: {
    isAdmin() {
      return this.user?.role === 'server:admin'
    }
  }
}
</script>
