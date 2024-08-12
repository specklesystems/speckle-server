<template>
  <div><slot /></div>
</template>
<script setup lang="ts">
import { useViewerPostSetup } from '~~/lib/viewer/composables/setup/postSetup'

/**
 * The only point of this component is to get around the stupid limitation where a component that injects() also can't provide() the same stuff back...
 * So the Viewer root component should invoke `useSetupViewer()` to do all of the `injects()` and then this will invoke `useViewerPostSetup()` which
 * will do extra setup that relies on the state being done and injectable.
 */

useViewerPostSetup()
</script>
