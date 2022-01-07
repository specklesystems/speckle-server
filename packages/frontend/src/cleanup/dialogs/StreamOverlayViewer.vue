<template>
  <v-card>
    <v-card-title
      class="blue dark d-flex align-center flex-grow-1 elevation-3"
      style="position: sticky; width: 100%; top: 0; z-index: 100"
    >
      <div class="flex-shrink-1">
        <v-select
          v-model="selectedOption"
          filled
          dark
          rounded
          dense
          hide-details
          :items="items"
          prepend-inner-icon="mdi-source-branch"
          style="width: 300px; max-width: 60vw"
        />
      </div>
      <div class="text-right flex-grow-1">
        <v-btn v-tooltip="'TODO: Add by object id'" dark small icon class="ml-2">
          <v-icon small>mdi-cube-outline</v-icon>
        </v-btn>
        <v-btn dark icon class="ml-2" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-card-title>
    <v-card-text></v-card-text>
    <v-card-text>
      <all-commits
        v-if="selectedOption === 'All Commits'"
        :stream-id="streamId"
        @add-resource="(e) => $emit('add-resource', e)"
      />
      <all-commits-branch
        v-else
        :stream-id="streamId"
        :branch-name="selectedOption"
        @add-resource="(e) => $emit('add-resource', e)"
      />
    </v-card-text>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
export default {
  components: {
    // SectionCard: () => import('@/cleanup/components/common/SectionCard')
    AllCommits: () => import('@/cleanup/dialogs/AllCommits'),
    AllCommitsBranch: () => import('@/cleanup/dialogs/AllCommitsBranch')
  },
  props: ['streamId'],
  apollo: {},
  data() {
    return {
      items: ['All Commits'],
      selectedOption: 'All Commits'
    }
  },
  async mounted() {
    console.log(this.streamId)
    let res = await this.$apollo.query({
      query: gql`
        query {
          stream(id: "${this.streamId}") {
            id
            name
            branches {
              totalCount
              items {
                id
                name
                commits {
                  totalCount
                }
              }
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.streamId
        }
      }
    })
    res.data.stream.branches.items.forEach((b) => {
      if (b.commits.totalCount !== 0) this.items.push(b.name)
    })
  }
}
</script>
