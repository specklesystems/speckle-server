<template>
  <v-app dark>
    <router-view></router-view>
  </v-app>
</template>
<script>
import HelloWorld from './components/HelloWorld';

export default {
  name: 'App',

  components: {
    HelloWorld,
  },

  data: ( ) => ( {
    setup: true
  } ),
  
}
</script>