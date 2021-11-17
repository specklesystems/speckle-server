<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title>Stream Administration</v-toolbar-title>
    </v-toolbar>
    <v-text-field
      v-model="searchQuery"
      class="mx-4 mt-4"
      :prepend-inner-icon="'mdi-magnify'"
      :loading="$apollo.loading"
      label="Search streams"
      type="text"
      single-line
      clearable
      rounded
      filled
      dense
    ></v-text-field>
    sort by size, update date, and what else?
    <v-list v-if="!$apollo.loading" rounded>
      <v-list-item-group>
        <v-list-item v-for="stream in streams.items" :key="stream.id" two-line>
          <v-list-item-content>
            <v-list-item-title>{{ stream.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ stream.description ? stream.description : 'Stream has no description' }}
            </v-list-item-subtitle>
            <div class="mt-2">
              <v-chip class="mx-2" small>
                Last activity
                <timeago :datetime="stream.updatedAt" class="ml-1 mr-"></timeago>
              </v-chip>
              <v-chip small class="mr-2 pr-5">
                <v-icon small class="mr-2">mdi-source-branch</v-icon>
                {{ stream.branches.totalCount }}
              </v-chip>
              total size 20 gb
            </div>
          </v-list-item-content>
          <v-list-item-action>
            <div
              style="cursor: pointer; min-height: 33px; line-height: 33px"
              :class="`grey ${$vuetify.theme.dark ? 'darken-3' : 'lighten-3'} rounded-xl px-2`"
            >
              <v-icon small>mdi-call-received</v-icon>
              <user-avatar
                v-for="user in stream.collaborators.slice(0, 3)"
                v-show="$vuetify.breakpoint.smAndUp"
                :id="user.id"
                :key="user.id"
                :show-hover="false"
                :size="25"
              ></user-avatar>

              <v-avatar
                v-if="stream.collaborators.length > 3"
                v-show="$vuetify.breakpoint.smAndUp"
                class="ml-1"
                size="25"
                color="primary"
              >
                <span class="white--text caption">+{{ stream.collaborators.length - 3 }}</span>
              </v-avatar>
              <v-avatar v-show="$vuetify.breakpoint.xsOnly" class="ml-1" size="25" color="primary">
                <span class="white--text caption">{{ stream.collaborators.length }}</span>
              </v-avatar>
            </div>
          </v-list-item-action>
          <v-list-item-action>
            <v-btn icon @click="initiateDeleteUser(user)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <v-skeleton-loader v-else class="mx-auto" type="card"></v-skeleton-loader>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import UserAvatar from '@/components/UserAvatar'

export default {
  name: 'AdminStreams',
  components: { UserAvatar },
  data() {
    return {
      searchQuery: null,
      streams: {
        items: [],
        totalCount: 0
      }
    }
  },
  apollo: {
    streams: {
      query: gql`
        query Streams {
          streams {
            items {
              id
              name
              description
              isPublic
              createdAt
              updatedAt
              branches {
                totalCount
              }
              collaborators {
                id
                name
                role
                company
                avatar
              }
            }
            totalCount
            cursor
          }
        }
      `
    }
  }
}
</script>
