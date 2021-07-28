<template>
  <v-breadcrumbs
    v-if="!$apollo.loading"
    class="display-1"
    :items="breadcrumbs"
    divider="/"
  ></v-breadcrumbs>
</template>

<script>
import gql from 'graphql-tag'
export default {
  name: 'BreadcrumbTitle',
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    },

    branch: {
      query: gql`
        query Stream($streamId: String!, $branchName: String!) {
          stream(id: $streamId) {
            id
            name
            branch(name: $branchName) {
              id
              name
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          branchName: this.$route.params.branchName
        }
      },
      skip() {
        return !this.$route.params.branchName
      },
      update: (data) => {
        return data.stream.branch
      }
    },
    commit: {
      query: gql`
        query Stream($streamId: String!, $commitId: String!) {
          stream(id: $streamId) {
            id
            name
            commit(id: $commitId) {
              id
              branchName
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          commitId: this.$route.params.commitId
        }
      },
      skip() {
        return !this.$route.params.commitId
      },
      update: (data) => {
        return data.stream.commit
      }
    }
  },
  computed: {
    breadcrumbs() {
      let items = [
        {
          text: this.stream.name,
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id
        }
      ]

      if (this.branch) {
        items.push({
          text: 'branches',
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id + '/branches/'
        })
        items.push({
          text: this.branch.name,
          disabled: true,
          exact: true,
          to: '/streams/' + this.stream.id + '/branches/' + encodeURIComponent(this.branch.name)
        })
      } else if (this.commit) {
        items.push({
          text: 'branches',
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id + '/branches/'
        })
        items.push({
          text: this.commit.branchName,
          disabled: false,
          exact: true,
          to:
            '/streams/' + this.stream.id + '/branches/' + encodeURIComponent(this.commit.branchName)
        })
        items.push({
          text: this.commit.id,
          disabled: true
        })
      } else if (this.$route.name !== 'stream') {
        items.push({
          text: this.$route.name,
          disabled: true
        })
      }

      return items
    }
  }
}
</script>

<style scoped lang="scss"></style>
