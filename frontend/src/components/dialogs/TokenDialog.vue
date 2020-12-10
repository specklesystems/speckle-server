<template>
  <v-card class="pa-4" color="background2">
    <v-card-title class="subtitle-1">
      Create a New Personal Access Token
    </v-card-title>
    <v-card-text>
      <v-form>
        <h3 class="mt-3">Token Scopes</h3>
        <p>
          It's good practice to limit the scopes of your token to the absolute
          minimum. For example, if your application or script will only read and
          write streams, select just those scopes.
        </p>
        <template v-for="scope in scopes">
          <v-row :key="scope.name" class="ml-1">
            <v-col class="align-self-center pa-0">
              <v-checkbox
                v-model="selectedScopes"
                :value="scope.name"
                :label="`${scope.name}`"
              />
            </v-col>
            <v-col class="align-self-center pa-0">
              <span class="caption">{{ scope.description }}</span>
            </v-col>
            <v-col cols="12">
              <v-divider class=""></v-divider>
            </v-col>
          </v-row>
        </template>
        <p v-if="selectedScopes.length === 0" class="error--text">
          Please select some scopes.
        </p>
        <br />
        <h3 class="mt-3">Token Name</h3>
        <p>
          A name to remember this token by - can be the name of the script or
          application you're planning to use it in!
        </p>
        <v-text-field
          v-model="name"
          label="Token Name"
          :rules="nameRules"
          required
          filled
          autofocus
        ></v-text-field>
        <br />
        <v-btn>Save</v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script>
import gql from "graphql-tag"

export default {
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  apollo: {
    scopes: {
      query: gql`
        query {
          serverInfo {
            scopes {
              name
              description
            }
          }
        }
      `,
      update: (data) => data.serverInfo.scopes
    }
  },
  data() {
    return {
      name: null,
      nameRules: [
        (v) => !!v || "Name is required",
        (v) => (v && v.length <= 60) || "Name must be less than 60 characters"
      ],
      selectedScopes: []
    }
  },
  computed: {
    showDialog: {
      get() {
        return this.show
      },
      set(value) {
        this.$emit("input", value)
      }
    }
  },
  methods: {}
}
</script>
