<template>
  <v-select
    v-model="model"
    filled
    rounded
    dense
    hide-details
    :items="items"
    prepend-icon="mdi-source-branch"
    :disabled="loading"
  />
</template>
<script lang="ts">
import { StreamBranchesSelectorDocument } from '@/graphql/generated/graphql'
import { Nullable } from '@/helpers/typeHelpers'
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'BranchSelect',
  props: {
    streamId: {
      type: String,
      required: true
    },
    value: {
      type: String as PropType<Nullable<string>>,
      default: null
    },
    excludedNames: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const { result, loading } = useQuery(StreamBranchesSelectorDocument, () => ({
      streamId: props.streamId
    }))

    const items = computed(() =>
      (result.value?.stream?.branches?.items || [])
        .filter((i) => !props.excludedNames.includes(i.name))
        .map((i) => i.name)
    )
    const model = computed({
      get: () => props.value,
      set: (newVal) => emit('input', newVal)
    })

    return { items, loading, model }
  }
})
</script>
