<template>
  <div v-if="strategies && strategies.length !== 0">
    <v-card-title class="justify-center py-2 body-1 text--secondary">
      <v-divider class="mx-4"></v-divider>
      Sign in with
      <v-divider class="mx-4"></v-divider>
    </v-card-title>
    <v-card-text class="pb-5">
      <template v-for="s in strategies">
        <v-col :key="s.name" cols="12" class="text-center py-1 my-0">
          <v-btn
            dark
            block
            :color="s.color"
            :href="`${s.url}?appId=${appId}&challenge=${challenge}${
              suuid ? '&suuid=' + suuid : ''
            }${inviteId ? '&inviteId=' + inviteId : ''}`"
          >
            <v-icon small class="mr-5">{{ s.icon }}</v-icon>
            {{ s.name }}
          </v-btn>
        </v-col>
      </template>
    </v-card-text>
  </div>
</template>
<script>
export default {
  name: 'Strategies',
  props: ['strategies', 'appId', 'challenge', 'suuid'],
  data() {
    return {
      inviteId: null
    }
  },
  mounted() {
    let urlParams = new URLSearchParams(window.location.search)
    let inviteId = urlParams.get('inviteId')
    this.inviteId = inviteId
  }
}
</script>
