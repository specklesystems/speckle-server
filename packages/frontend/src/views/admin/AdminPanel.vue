<template lang="html">
  <v-container v-if="isAdmin">
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="3" class="pt-md-10">
        <v-card id="sideMenu" elevation="1" class="rounded-lg overflow-hidden">
          <v-card-title class="text--secondary font-weight-regular">Admin panel</v-card-title>
          <div v-for="child in childRoutes" :key="child.to">
            <router-link :to="child.to" v-slot="{ isExactActive, route, navigate }">
              <v-hover v-slot="{ hover }">
                  <span :disabled="isExactActive"
                        @click="navigate"
                        :class="{'active-border primary--text': isExactActive,'primary--text': hover}"
                        class="pa-2 pl-6 text-left d-flex admin-menu-item bold">
                    <v-icon small class="pr-1" :color="(hover || isExactActive) ? 'primary' : null">{{ child.icon
                                                                                                    }}</v-icon>
                    {{ child.name }}
                  </span>
              </v-hover>
            </router-link>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="12" md="8" lg="9" xl="9" class="pt-md-10">
        <v-fade-transition mode="out-in">
          <router-view></router-view>
        </v-fade-transition>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else-if="!isAdmin && $apollo.loading">
    <v-card>
      <v-card-text class="text-center">
        <v-icon size="50" color="error">mdi-alert</v-icon>
        <h3>Sorry...but maybe you shouldn't be here!</h3>
        <p>You are not an admin on this server</p>
        <v-btn @click="$router.back()">Go back</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import gql from "graphql-tag";

export default {
  name: "AdminPanel",
  data() {
    return {
      childRoutes: [
        {
          name: "Dashboard",
          to: "/admin",
          icon: "mdi-view-dashboard"
        },
        // {
        //   name: "Users",
        //   to: "/admin/users",
        //   icon: "mdi-account-multiple"
        // },
        // {
        //   name: "Streams",
        //   to: "/admin/streams",
        //   icon: "mdi-cloud"
        // },
        {
          name: "Settings",
          to: "/admin/settings",
          icon: "mdi-cog"
        }
      ]
    };
  },
  apollo: {
    user: {
      query: gql`query { user { role }}`
    }
  },
  computed:{
    isAdmin(){
      return this.user?.role === "server:admin"
    }
  }
};
</script>

<style lang="scss">

.gray-border {
  border-top: 1pt solid var(--v-background-base) !important;
}

.admin-menu-item {
  overflow: hidden;
  position: relative;
  border-top: 1pt solid var(--v-background-base) !important;
  cursor: pointer;
  transition: 0.5s all ease-out, border-top-color 0s;

  &::before {
    @include speckle-gradient-bg;

    position: absolute;
    content: "";
    width: 0;
    height: 100%;
    top: 0;
    left: 0;
    transition: all 0.5s ease-in-out, border-top-color 0s;
  }

  &.active-border::before {
    width: 4pt;
  }
}
</style>
