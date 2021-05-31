<template>
  <v-container>
    <div v-if="!commitId && !$apollo.loading">
      <h1>Empty State</h1>
      <p>TODO: Help, there's no globals branch and/or no commits on it!</p>
    </div>
    <div v-else>
      <h1>wow globals</h1>
      <v-row>
        <v-col>
          <globals-builder
            v-if="stream"
            :stream-id="streamId"
            :commit-id="commitId"
            :user-role="$attrs['user-role']"
          />
        </v-col>
      </v-row>
      <h1>History</h1>
      <p>TODO</p>
    </div>
  </v-container>
</template>

<script>
import branchQuery from '../graphql/branch.gql'
import GlobalsBuilder from '../components/GlobalsBuilder'

export default {
  name: 'Globals',
  components: {
    GlobalsBuilder
  },
  apollo: {
    stream: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.streamId,
          branchName: 'globals' //TODO: handle multipile globals branches
        }
      }
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    commitId() {
      return this.stream?.branch?.commits?.items[0].referencedObject
    }
  }
}
</script>

<style></style>
