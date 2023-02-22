<template>
  <v-list-item
    link
    :href="to"
    :class="itemClass"
    :dark="isPrimary"
    @click="$emit('click', $event)"
  >
    <v-list-item-icon v-if="icon">
      <v-icon>{{ icon }}</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        <slot />
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <slot name="subtitle" />
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>
<script lang="ts">
import { Optional } from '@/helpers/typeHelpers'
import { useVuetify } from '@/main/lib/core/composables/core'
import { computed, defineComponent, PropType } from 'vue'

type ItemType = 'primary' | 'secondary'

export default defineComponent({
  name: 'RoundedButtonListItem',
  props: {
    type: {
      type: String as PropType<ItemType>,
      default: () => 'primary'
    },
    icon: {
      type: String as PropType<Optional<string>>,
      default: () => undefined
    },
    to: {
      type: String as PropType<Optional<string>>,
      default: () => undefined
    }
  },
  setup(props) {
    const vuetify = useVuetify()
    const itemClass = computed(() => {
      const classes = ['']
      switch (props.type) {
        case 'primary':
          classes.push('primary')
          break
        case 'secondary':
          classes.push(`grey ${vuetify.theme.dark ? 'darken-4' : 'lighten-4'}`)
          break
      }

      return classes
    })

    const isPrimary = computed(() => props.type === 'primary')

    return {
      itemClass,
      isPrimary
    }
  }
})
</script>
