<script lang="ts">
import { h } from 'vue'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

export default defineComponent({
  setup() {
    definePageMeta({
      layout: 'hydrationtest'
    })

    const { activeUser } = useActiveUser()

    return { activeUser }
  },
  render() {
    const strVal = `Hello, ${this.activeUser?.name || 'guest'}!`
    return h('div', strVal)
  }
})
</script>
