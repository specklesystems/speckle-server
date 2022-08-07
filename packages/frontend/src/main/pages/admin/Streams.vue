<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      Stream Administration
      <span v-if="adminStreams">
        ({{ adminStreams.items.length }} of {{ adminStreams.totalCount }} streams)
      </span>
    </portal>
    <portal v-if="canRenderActionsPortal" to="actions">
      <v-pagination
        v-model="currentPage"
        :length="numberOfPages"
        :total-visible="4"
        circle
      ></v-pagination>
    </portal>
    <section-card>
      <v-text-field
        v-model="searchQuery"
        class="mt-4 mx-2"
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
      <div class="mx-2">
        <div class="d-flex align-center">
          <v-select
            v-model="queryLimit"
            :items="[10, 25, 50]"
            rounded
            dense
            filled
            label="streams per page"
            class="mr-2"
          ></v-select>
          <v-select
            v-model="streamVisibility"
            :items="['all', 'public', 'private']"
            rounded
            dense
            filled
            label="visibility"
            class="mr-2"
          ></v-select>
          <v-select
            v-model="orderColumn"
            :items="['updatedAt', 'size']"
            rounded
            dense
            filled
            label="order streams by"
            class="mr-2"
          ></v-select>
          <v-btn
            icon
            class="mb-6"
            elevation="0"
            @click="orderDirection = orderDirection === 'desc' ? 'asc' : 'desc'"
          >
            <v-icon>mdi-arrow-{{ orderDirection === 'desc' ? 'down' : 'up' }}</v-icon>
          </v-btn>
        </div>
      </div>
      <!-- </v-card-text> -->
      <div v-if="!$apollo.loading">
        <div v-for="stream in adminStreams.items" :key="stream.id">
          <stream-list-item :stream="stream" @delete="initiateDeleteStreams" />
        </div>
      </div>
      <v-skeleton-loader v-else class="mx-auto" type="card"></v-skeleton-loader>
      <v-pagination
        v-model="currentPage"
        :length="numberOfPages"
        :total-visible="7"
        circle
        class="my-2"
      ></v-pagination>
    </section-card>
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
  </div>
</template>

<script>
import { gql } from '@apollo/client/core'
import debounce from 'lodash/debounce'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  name: 'AdminStreams',
  components: {
    SectionCard: () => import('@/main/components/common/SectionCard'),
    StreamListItem: () => import('@/main/components/admin/StreamListItem')
  },
  mixins: [
    buildPortalStateMixin(
      [STANDARD_PORTAL_KEYS.Toolbar, STANDARD_PORTAL_KEYS.Actions],
      'admin-streams',
      1
    )
  ],
  props: {
    page: { type: [Number, String], required: false, default: null },
    limit: { type: [Number, String], required: false, default: 20 },
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
        const [column] = this.orderBy.split(',')
        return column
      },
      set(column) {
        const direction = this.orderBy.split(',').pop()
        const orderBy = `${column},${direction}`
        this.navigateNext({ orderBy })
      }
    },
    orderDirection: {
      get() {
        return this.orderBy.split(',').pop()
      },
      set(direction) {
        const [column] = this.orderBy.split(',')
        const orderBy = `${column},${direction}`
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
      const ids = [this.manipulatedStream.id]
      await this.$apollo.mutate({
        mutation: gql`
          mutation ($ids: [String!]) {
            streamsDelete(ids: $ids)
          }
        `,
        variables: {
          ids
        },
        update: () => {
          this.$apollo.queries.adminStreams.refetch()
        },
        error: (err) => {
          this.$eventHub.$emit('notification', {
            text: err.message
          })
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
      const newParams = { ...this.$props }

      for (const key in routeParams) {
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
              commits {
                totalCount
              }
              collaborators {
                id
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
