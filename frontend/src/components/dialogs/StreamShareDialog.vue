<template>
  <v-dialog v-model="dialog" width="600" @keydown.esc="dialog = false">
    <v-card class="pa-4">
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
                multiple
                chips
                autofocus
                hide-no-data
                label="Users"
                placeholder="Type to search..."
                item-text="name"
                return-object
                clearable
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
                    <v-avatar left color="grey lighten-3">
                      <v-img
                        :src="
                          `https://robohash.org/` + item.id + `.png?size=32x32`
                        "
                      />
                    </v-avatar>
                    <span v-text="item.name"></span>
                  </v-chip>
                </template>
                <template #item="{ item }">
                  <v-list-item-avatar color="grey lighten-3">
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
            <v-col cols="12" class="pt-0 pb-0">
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
            <v-col cols="12" class="pt-0 pb-0">
              <!-- <v-switch
                v-model="stream.isPublic"
                :label="`Link sharing ` + (stream.isPublic ? `on` : `off`)"
              ></v-switch> -->
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
    dialog: true,
    search: "",
    query: "",
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
      }
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
    selectedRole(val) {
      console.log(val)
    }
  },
  methods: {
    open() {
      this.dialog = true
    },
    remove(item) {
      console.log(item)
      const index = this.selectedUsers.map((x) => x.id).indexOf(item.id)
      if (index >= 0) this.selectedUsers.splice(index, 1)
    },
    // filter(item) {
    //   console.log("A")
    //   return (
    //     this.stream.collaborators.filter((x) => x.id === item.id).length === 0
    //   )
    // },
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
