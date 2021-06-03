<template>
  <v-container>
    <div v-if="!objectId && !$apollo.loading">
      <v-card>
        <v-card-title>Globals</v-card-title>
      </v-card>
      <h1>Empty State</h1>
      <p>TODO: Help, there's no globals branch and/or no commits on it!</p>
    </div>
    <div v-else>
      <v-row>
        <v-col>
          <globals-builder
            v-if="stream"
            :branch-name="branchName"
            :stream-id="streamId"
            :object-id="objectId"
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
          branchName: this.branchName
        }
      }
    }
  },
  data() {
    return {
      branchName: 'globals' //TODO: handle multipile globals branches
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    objectId() {
      return this.stream?.branch?.commits?.items[0].referencedObject
    }
  }
}
</script>

<style></style>
