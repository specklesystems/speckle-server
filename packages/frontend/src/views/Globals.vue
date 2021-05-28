<template>
  <v-container>
    <!-- TODO: dropdown to choose diff globals branches? -->
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
  </v-container>
</template>

<script>
import branchQuery from '../graphql/branch.gql'

export default {
  name: 'Globals',
  components: {
    GlobalsBuilder: () => import('../components/GlobalsBuilder')
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
      return this.stream.branch.commits.items[0].referencedObject
    }
  }
}
</script>

<style></style>
