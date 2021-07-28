<template>
  <v-container v-if="isOwner">
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="3" class="pt-md-10">
        <v-card id="sideMenu" elevation="1" class="rounded-lg overflow-hidden">
          <v-card-title class="tmr-8 display-1 text--secondary">
            {{ stream.name }}
            <br />
            <v-btn block plain small class="justify-start mt-3 pa-0" :to="'/streams/' + stream.id">
              <v-icon small>mdi-chevron-left</v-icon>
              back to stream
            </v-btn>
          </v-card-title>
          <div v-for="child in childRoutes" :key="child.to">
            <router-link v-slot="{ isActive, navigate }" :to="child.to">
              <v-hover v-slot="{ hover }">
                <span
                  :class="{ 'active-border primary--text': isActive, 'primary--text': hover }"
                  class="pa-2 pl-6 text-left d-flex menu-item bold"
                  @click="navigate"
                >
                  {{ child.name }}
                </span>
              </v-hover>
            </router-link>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="12" md="8" lg="9" xl="9" class="pt-md-10">
        <v-fade-transition mode="out-in">
          <router-view :user-role="userRole" />
        </v-fade-transition>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else-if="!isOwner && !$apollo.loading">
    <v-card>
      <v-card-text class="text-center">
        <v-icon size="50" color="error">mdi-alert</v-icon>
        <h3>Sorry...but maybe you shouldn't be here!</h3>
        <p>
          Either this stream does not exist or you do not have the required permissions to edit this
          stream's settings.
        </p>
        <v-btn @click="$router.back()">Go back</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import streamQuery from '../../graphql/stream.gql'

export default {
  name: 'Settings',
  components: {},
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.$attrs.streamId
        }
      },
      error(err) {
        if (err.message) this.error = err.message.replace('GraphQL error: ', '')
        else this.error = err
      }
    }
  },
  data() {
    return {
      childRoutes: [
        {
          name: 'General',
          to: `/settings/streams/${this.$attrs.streamId}/general`
        },
        {
          name: 'Webhooks',
          to: `/settings/streams/${this.$attrs.streamId}/webhooks`
        },
        {
          name: 'Globals',
          to: `/settings/streams/${this.$attrs.streamId}/globals`
        }
      ]
    }
  },
  computed: {
    userRole() {
      let uuid = localStorage.getItem('uuid')
      if (!uuid) return null
      if (this.$apollo.loading) return null
      if (!this.stream) return null
      let contrib = this.stream.collaborators.find((u) => u.id === uuid)
      if (contrib) return contrib.role.split(':')[1]
      else return null
    },
    isOwner() {
      return this.userRole === 'owner'
    }
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.gray-border {
  border-top: 1pt solid var(--v-background-base) !important;
}

.menu-item {
  overflow: hidden;
  position: relative;
  border-top: 1pt solid var(--v-background-base) !important;
  cursor: pointer;
  transition: 0.1s all ease-out, border-top-color 0s;

  &::before {
    @include speckle-gradient-bg;

    position: absolute;
    content: '';
    width: 0;
    height: 100%;
    top: 0;
    left: 0;
    transition: all 0.1s ease-in-out, border-top-color 0s;
  }

  &.active-border::before {
    width: 4pt;
  }
}
</style>
