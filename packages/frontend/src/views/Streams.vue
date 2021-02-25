<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <v-card rounded="lg" class="pa-5" elevation="0" color="background">
          <v-card-title>Streams</v-card-title>
          <v-card-text>
            You have {{ streams.totalCount }} stream{{ streams.totalCount == 1 ? `` : `s` }}
            in total.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" elevation="0" block @click="newStreamDialog = true">
              <v-icon small class="mr-1">mdi-plus-box</v-icon>
              new stream
            </v-btn>
          </v-card-actions>
          <v-dialog v-model="newStreamDialog" max-width="500">
            <new-stream-dialog :open="newStreamDialog" />
          </v-dialog>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="7">
        <v-card class="mt-4" elevation="0" color="transparent">
          <div v-if="$apollo.loading">
            <v-skeleton-loader type="card, article, article"></v-skeleton-loader>
          </div>
          <v-card-text v-if="streams && streams.items">
            <div v-for="(stream, i) in streams.items" :key="i">
              <list-item-stream :stream="stream"></list-item-stream>
            </div>
            <infinite-loading
              v-if="streams.items.length < streams.totalCount"
              @infinite="infiniteHandler"
            >
              <div slot="no-more">These are all your streams!</div>
              <div slot="no-results">There are no streams to load</div>
            </infinite-loading>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import gql from 'graphql-tag'
import ListItemStream from '../components/ListItemStream'
import NewStreamDialog from '../components/dialogs/NewStreamDialog'
import streamsQuery from '../graphql/streams.gql'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'Streams',
  components: { ListItemStream, NewStreamDialog, InfiniteLoading },
  apollo: {
    streams: {
      prefetch: true,
      query: streamsQuery,
      fetchPolicy: 'cache-and-network' //https://www.apollographql.com/docs/react/data/queries/
    }
  },
  data: () => ({
    streams: [],
    newStreamDialog: false
  }),
  computed: {},
  watch: {},
  methods: {
    infiniteHandler($state) {
      this.$apollo.queries.streams.fetchMore({
        variables: {
          cursor: this.streams.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.streams.items

          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          return {
            streams: {
              __typename: previousResult.streams.__typename,
              totalCount: fetchMoreResult.streams.totalCount,
              cursor: fetchMoreResult.streams.cursor,
              // Merging the new streams
              items: [...previousResult.streams.items, ...newItems]
            }
          }
        }
      })
    },
    newStream() {
      this.$refs.streamDialog.open().then((dialog) => {
        if (!dialog.result) return
        this.$matomo && this.$matomo.trackPageView('stream/create')
        this.$apollo
          .mutate({
            mutation: gql`
              mutation streamCreate($myStream: StreamCreateInput!) {
                streamCreate(stream: $myStream)
              }
            `,
            variables: {
              myStream: {
                name: dialog.stream.name,
                description: dialog.stream.description,
                isPublic: dialog.stream.isPublic
              }
            }
          })
          .then((data) => {
            // Result
            console.log(data)

            this.$apollo.queries.streams.refetch()
          })
          .catch((error) => {
            // Error
            console.error(error)
          })
      })
    }
  }
}
</script>
<style></style>
