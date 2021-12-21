<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title>
        Stream Administration
        <span v-if="adminStreams">
          ({{ adminStreams.items.length }} of {{ adminStreams.totalCount }} streams)
        </span>
      </v-toolbar-title>
    </v-toolbar>
    <v-card-subtitle>
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
      <div class="mx-4">
        <div class="d-flex">
          <v-select
            v-model="queryLimit"
            :items="[10, 25, 50]"
            rounded
            dense
            filled
            flat
            label="streams per page"
            class="mr-2"
          ></v-select>
          <v-select
            v-model="streamVisibility"
            :items="['all', 'public', 'private']"
            rounded
            dense
            filled
            flat
            label="visibility"
            class="mr-2"
          ></v-select>
          <v-select
            v-model="orderColumn"
            :items="['updatedAt', 'size']"
            rounded
            dense
            filled
            flat
            label="order streams by"
            class="mr-2"
          ></v-select>
          <v-btn
            fab
            elevation="0"
            @click="orderDirection = orderDirection === 'desc' ? 'asc' : 'desc'"
          >
            <v-icon>mdi-arrow-expand-{{ orderDirection === 'desc' ? 'down' : 'up' }}</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card-subtitle>
    <v-list v-if="!$apollo.loading" rounded>
      <v-list-item-group class="ml-6">
        <v-list-item v-for="stream in adminStreams.items" :key="stream.id" two-line>
          <v-list-item-content>
            <v-list-item-title>
              <router-link
                class="text-h6 text-decoration-none"
                :to="`/streams/${stream.id}`"
                target="_blank"
              >
                {{ stream.name }}
              </router-link>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ stream.description ? stream.description : 'Stream has no description' }}
            </v-list-item-subtitle>
            <div class="mt-1">
              <v-chip small>
                <v-icon small>
                  {{ stream.isPublic ? 'mdi-lock-open-variant-outline' : 'mdi-lock-outline' }}
                </v-icon>
              </v-chip>
              <v-chip class="mx-2" small>
                Last activity
                <timeago :datetime="stream.updatedAt" class="ml-1 mr-"></timeago>
              </v-chip>
              <v-chip small class="mr-2 pr-5">
                <v-icon small class="mr-2">mdi-source-branch</v-icon>
                {{ stream.branches.totalCount }}
              </v-chip>
              <v-chip small class="mr-2">
                Data usage {{ `${(stream.size ? stream.size / 1048576 : 0.0).toFixed(2)} MB` }}
              </v-chip>
            </div>
          </v-list-item-content>
          <v-list-item-action>
            <div
              style="cursor: pointer; min-height: 33px; line-height: 33px"
              :class="`grey ${$vuetify.theme.dark ? 'darken-3' : 'lighten-3'} rounded-xl px-2`"
            >
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
            <v-btn icon @click="initiateDeleteStreams(stream)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list-item-group>
      <div class="text-center">
        <v-pagination
          v-model="currentPage"
          :length="numberOfPages"
          :total-visible="7"
          circle
        ></v-pagination>
      </div>
    </v-list>
    <v-skeleton-loader v-else class="mx-auto" type="card"></v-skeleton-loader>
    <v-dialog v-model="showDeleteDialog" persistent max-width="600px">
      <v-card v-if="showDeleteDialog">
        <v-toolbar flat class="mb-6">
          <v-toolbar-title>Confirm stream deletion</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-alert type="error">
            Confirm deletion of
            <b>{{ manipulatedStream.name }}</b>
            stream from the server.
            <br />
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" text @click="deleteStreams">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import UserAvatar from '@/components/UserAvatar'
import debounce from 'lodash.debounce'

export default {
  name: 'AdminStreams',
  components: { UserAvatar },
  props: {
    page: { type: [Number, String], required: false, default: null },
    limit: { type: [Number, String], required: false, default: 10 },
    q: { type: String, required: false, default: null },
    orderBy: { type: String, required: false, default: 'updatedAt,desc' },
    visibility: { type: String, required: false, default: 'all' }
  },
  data() {
    return {
      showDeleteDialog: false,
      manipulatedStream: null,
      adminStreams: {
        items: [],
        totalCount: 0
      }
    }
  },
  computed: {
    numberOfPages() {
      return Math.ceil(this.adminStreams.totalCount / this.queryLimit)
    },
    currentPage: {
      get() {
        return this.page ? parseInt(this.page) : 1
      },
      set(page) {
        this.navigateNext({ page })
      }
    },
    queryLimit: {
      get() {
        return this.limit ? parseInt(this.limit) : 10
      },
      set(limit) {
        this.navigateNext({ limit })
      }
    },
    searchQuery: {
      get() {
        return this.q
      },
      set: debounce(function (q) {
        this.navigateNext({ q })
      }, 1000)
    },
    orderColumn: {
      get() {
        let [column] = this.orderBy.split(',')
        return column
      },
      set(column) {
        let direction = this.orderBy.split(',').pop()
        let orderBy = `${column},${direction}`
        this.navigateNext({ orderBy })
      }
    },
    orderDirection: {
      get() {
        return this.orderBy.split(',').pop()
      },
      set(direction) {
        let [column] = this.orderBy.split(',')
        let orderBy = `${column},${direction}`
        this.navigateNext({ orderBy })
      }
    },
    streamVisibility: {
      get() {
        return this.visibility
      },
      set(visibility) {
        this.navigateNext({ visibility })
      }
    }
  },
  methods: {
    initiateDeleteStreams(stream) {
      this.showDeleteDialog = true
      this.manipulatedStream = stream
    },
    async deleteStreams() {
      let ids = [this.manipulatedStream.id]
      await this.$apollo.mutate({
        mutation: gql`
          mutation($ids: [String!]) {
            streamsDelete(ids: $ids)
          }
        `,
        variables: {
          ids: ids
        },
        update: () => {
          this.$apollo.queries.adminStreams.refetch()
        },
        error: (err) => {
          console.log(err)
        }
      })
      this.manipulatedStream = null
      this.showDeleteDialog = false
    },
    navigateNext(routeParams) {
      this.$router.push(this._prepareRoute(routeParams))
    },
    _prepareRoute(routeParams) {
      let newRoute = 'streams'
      let newParams = { ...this.$props }

      for (let key in routeParams) {
        newParams[key] = routeParams[key]
      }

      Object.keys(newParams).forEach((attr, index) => {
        index === 0 ? (newRoute += '?') : (newRoute += '&')
        if (newParams[attr]) newRoute += `${attr}=${newParams[attr]}`
      })
      return newRoute
    }
  },
  apollo: {
    adminStreams: {
      query: gql`
        query Streams(
          $offset: Int
          $limit: Int
          $orderBy: String
          $query: String
          $visibility: String
        ) {
          adminStreams(
            offset: $offset
            limit: $limit
            orderBy: $orderBy
            query: $query
            visibility: $visibility
          ) {
            items {
              id
              name
              description
              size
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
          }
        }
      `,
      variables() {
        return {
          offset: (this.currentPage - 1) * this.queryLimit,
          limit: this.queryLimit,
          query: this.searchQuery,
          orderBy: this.orderBy,
          visibility: this.streamVisibility
        }
      }
    }
  }
}
</script>
