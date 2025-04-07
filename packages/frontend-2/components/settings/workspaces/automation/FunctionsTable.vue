<template>
  <div>Howdy</div>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment SettingsWorkspacesAutomationFunctionsTable_Workspace on Workspace {
    id
    automateFunctions {
      items {
        id
        name
        logo
      }
      totalCount
    }
  }
`)
</script>
