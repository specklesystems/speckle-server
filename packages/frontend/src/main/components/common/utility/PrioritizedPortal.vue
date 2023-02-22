<template>
  <portal v-if="canRender" :to="to">
    <slot />
  </portal>
</template>
<script lang="ts">
import { usePortalState } from '@/main/utils/portalStateManager'
import { computed, defineComponent } from 'vue'

/**
 * This component should be used instead of <portal> when you have multiple portals that try to use the same <portal-target>,
 * possibly at the same time. The priority key will help choose which portal will actually render in the target.
 */

export default defineComponent({
  name: 'PrioritizedPortal',
  props: {
    /**
     * Name of portal-target that this portal should reach out to
     */
    to: {
      type: String,
      required: true
    },
    /**
     * Unique identity of this specific portal entrypoint
     */
    identity: {
      type: String,
      required: true
    },
    /**
     * Priority helps figure out which portal entrypoint should take precedence if multiple portals
     * attempt to use the same portal-target. A higher number = higher priority.
     *
     * Note: This value isn't reactive and can't be changed during runtime
     */
    priority: {
      type: Number,
      default: 1
    }
  },
  setup(props) {
    const { allowedPortals } = usePortalState(
      [props.to],
      props.identity,
      props.priority
    )
    const canRender = computed(() => allowedPortals.value[props.to])

    return {
      canRender
    }
  }
})
</script>
