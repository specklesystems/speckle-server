<template lang="html">
  <v-container>
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="3" class="pt-10">
        <v-card id="sideMenu" elevation="0" outlined rounded>
          <v-card-title>Admin panel</v-card-title>
          <v-card-text v-for="child in childRoutes" :key="child.to" class="pa-3">
            <router-link :to="child.to">{{ child.name }}</router-link>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="9" class="pt-10">
        <router-view></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'AdminPanel',
  data() {
    return {
      childRoutes: [
        {
          name: 'Dashboard',
          to: '/admin'
        },
        {
          name: 'Users',
          to: '/admin/users'
        },
        {
          name: 'Streams',
          to: '/admin/streams'
        }
      ]
    }
  }
}
</script>

<style lang="scss">
#sideMenu {
}
</style>
