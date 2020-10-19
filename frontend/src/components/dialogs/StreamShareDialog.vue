<template>
  <v-dialog v-model="dialog" width="600" @keydown.esc="dialog = false">
    <v-card class="pa-4" color="background2">
      <v-card-title class="subtitle-1">Manage collaborators</v-card-title>

      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-container>
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-autocomplete
                v-model="selectedUsers"
                :loading="$apollo.loading"
                :items="items"
                :search-input.sync="search"
                :filter="filter"
                multiple
                counter="3"
                chips
                autofocus
                hide-no-data
                hide-details
                placeholder="Type to search..."
                item-text="name"
                return-object
                clearable
                cache-items
                label="Users"
                item-value="id"
              >
                <template #selection="{ attr, on, item, selected }">
                  <v-chip
                    v-bind="attr"
                    :input-value="selected"
                    color="secondary"
                    class="white--text"
                    pill
                    close
                    v-on="on"
                    @click:close="remove(item)"
                  >
                    <v-avatar left color="background">
                      <v-img
                        :src="
                          `https://robohash.org/` + item.id + `.png?size=32x32`
                        "
                      />
                    </v-avatar>
                    <span v-text="item.name"></span>
                  </v-chip>
                </template>
                <template #item="{ item }" color="background">
                  <v-list-item-avatar color="background">
                    <v-img
                      :src="
                        `https://robohash.org/` + item.id + `.png?size=40x40`
                      "
                    />
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title v-text="item.name"></v-list-item-title>
                    <v-list-item-subtitle
                      v-text="item.company"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
          <v-row class="mb-5" align="center">
            <v-col cols="12" class="pt-4 pb-0">
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-select
                  v-model="selectedRole"
                  :items="roles"
                  item-text="name"
                  return-object
                  label="Role"
                  class="mr-5"
                  dense
                  style="width: 40px"
                >
                  <template #selection="{ item }">
                    <span class="caption">
                      {{ item.name.replace("stream:", "") }}
                    </span>
                  </template>
                  <template #item="{ item }">
                    <span class="caption">
                      {{ item.name.replace("stream:", "") }}
                    </span>
                  </template>
                </v-select>
                <v-btn
                  class="primary mb-3"
                  :disabled="
                    !selectedUsers ||
                    selectedUsers.length === 0 ||
                    !selectedRole
                  "
                  @click="grantStreamPermission"
                >
                  Add collaborators
                </v-btn>
              </v-card-actions>
              <div v-if="selectedRole" class="caption text-right">
                {{ selectedRole.description }}
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="pt-0 pb-0">
              <div class="subtitle-1 pb-2">Collaborators</div>
              <div v-for="(user, i) in stream.collaborators" :key="i">
                <list-item-user
                  :user="user"
                  :user-remove-click="revokeStreamPermission"
                  :is-unique-stream-owner="isUniqueStreamOwner(user.id)"
                ></list-item-user>
                <v-divider
                  v-if="i < stream.collaborators.length - 1"
                ></v-divider>
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="pt-3 pb-0">
              <v-banner color="secondary" class="white--text" single-line>
                <v-avatar slot="icon" color="white" size="32">
                  <v-icon color="secondary">mdi-link</v-icon>
                </v-avatar>

                Link sharing is
                <b>ON</b>
                anyone with a link to this stream is able to view it.
              </v-banner>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click.native="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import gql from "graphql-tag"
import serverQuery from "../../graphql/server.gql"
import streamCollaboratorsQuery from "../../graphql/streamCollaborators.gql"
import userSearchQuery from "../../graphql/userSearch.gql"
import ListItemUser from "../ListItemUser"

export default {
  components: { ListItemUser },
  props: ["streamId", "userId"],
  data: () => ({
    dialog: false,
    search: "",
    selectedUsers: null,
    selectedRole: null,
    userSearch: { items: [] },
    serverInfo: { roles: [] },
    user: {}
  }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamCollaboratorsQuery,
      variables() {
        // Use vue reactive properties here
        return {
          id: this.streamId
        }
      }
    },
    userSearch: {
      query: userSearchQuery,
      variables() {
        // Use vue reactive properties here
        return {
          query: this.search,
          limit: 25
        }
      },
      skip() {
        return !this.search || this.search.length < 3
      },
      debounce: 300
    },
    serverInfo: {
      prefetch: true,
      query: serverQuery
    }
  },
  computed: {
    roles() {
      return this.serverInfo.roles
        .filter((x) => x.resourceTarget === "streams")
        .reverse()
    },
    items() {
      let items = []
      this.userSearch.items.forEach((item) => {
        if (this.stream.collaborators.map((x) => x.id).indexOf(item.id) === -1)
          items.push(item)
      })
      return items
    }
  },
  watch: {
    selectedUsers(val) {
      //console.log(val)
      this.search = ""
    },
    roles(val) {
      this.selectedRole = this.roles[0]
    }
  },
  methods: {
    open() {
      this.dialog = true
    },
    //filters out cached items that have been added already
    //the cache-items prop is REQUIRED when using async items and a multiple prom
    filter(item) {
      return this.stream.collaborators.map((x) => x.id).indexOf(item.id) === -1
    },
    remove(item) {
      console.log(item)
      const index = this.selectedUsers.map((x) => x.id).indexOf(item.id)
      if (index >= 0) this.selectedUsers.splice(index, 1)
    },
    isUniqueStreamOwner(id) {
      return (
        this.userId === id &&
        this.stream.collaborators.filter((x) => x.role === "stream:owner")
          .length === 1 &&
        this.stream.collaborators.filter(
          (x) => x.id === this.userId && x.role === "stream:owner"
        ).length === 1
      )
    },
    grantStreamPermission() {
      var promises = []

      this.selectedUsers.forEach((user) => {
        promises.push(
          this.$apollo
            .mutate({
              mutation: gql`
                mutation streamGrantPermission(
                  $permissionParams: StreamGrantPermissionInput!
                ) {
                  streamGrantPermission(permissionParams: $permissionParams)
                }
              `,
              variables: {
                permissionParams: {
                  streamId: this.streamId,
                  userId: user.id,
                  role: this.selectedRole.name
                }
              }
            })
            .then((data) => {
              //
            })
            .catch((error) => {
              // Error
              console.error(error)
            })
        )
      })

      Promise.all(promises).then(() => {
        this.$apollo.queries.stream.refetch()
        this.selectedUsers = []
      })
    },
    revokeStreamPermission(id) {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation streamRevokePermission(
              $permissionParams: StreamRevokePermissionInput!
            ) {
              streamRevokePermission(permissionParams: $permissionParams)
            }
          `,
          variables: {
            permissionParams: {
              streamId: this.streamId,
              userId: id
            }
          }
        })
        .then((data) => {
          this.$apollo.queries.stream.refetch()
        })
        .catch((error) => {
          // Error
          console.error(error)
        })
    }
  }
}
</script>
