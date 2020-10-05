<template>
  <div v-if="user.streams && user.streams.items">
    <stream-box
      v-for="(stream, i) in user.streams.items"
      :key="i"
      :stream="stream"
    ></stream-box>
  </div>
</template>
<script>
import StreamBox from "../components/StreamBox"

export default {
  name: "Streams",
  components: { StreamBox },
  props: {
    user: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data: () => ({})
}
</script>
