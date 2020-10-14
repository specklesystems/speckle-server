<template>
  <v-dialog v-model="show" width="600" @keydown.esc="cancel">
    <v-card class="pa-4">
      <v-card-title class="subtitle-1">Manage collaborators</v-card-title>

      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-container>
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-autocomplete
                v-model="select"
                :loading="$apollo.loading"
                :items="userSearch.items"
                :search-input.sync="search"
                multiple
                chips
                autofocus
                hide-no-data
                cache-items
                label="Search"
                placeholder="Add collaborators"
                item-text="name"
                item-value="id"
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
          <v-row>
            <v-col cols="12" class="pt-0 pb-0">
              <list-item-user
                v-for="(user, i) in users"
                :key="i"
                :user="user"
              ></list-item-user>
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
        <v-btn color="primary" text @click.native="dialog = false">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import gql from "graphql-tag"
import userSearchQuery from "../../graphql/userSearch.gql"
import ListItemUser from "../ListItemUser"

export default {
  components: { ListItemUser },
  props: {
    users: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  data: () => ({
    dialog: true,
    search: "",
    query: "",
    select: null,
    userSearch: { items: [] }
  }),
  apollo: {
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
        return (
          !this.search || this.search === this.select || this.search.length < 3
        )
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.dialog
      },
      set(value) {
        this.dialog = value
        if (value === false) {
          this.cancel()
        }
      }
    }
  },
  watch: {
    users(val) {
      console.log(val)
    },
    "userSearch.items"(val) {
      console.log(val)
    }
  },
  methods: {
    open() {
      this.dialog = true
    },
    remove(item) {
      const index = this.select.indexOf(item.id)
      if (index >= 0) this.select.splice(index, 1)
    }
  }
}
</script>
