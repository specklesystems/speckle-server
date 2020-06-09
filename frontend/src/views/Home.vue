<template>
  <div>
    <h1>Hello, {{user.name}}! <code>{{user.id}}</code></h1>
  </div>
</template>
<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import gql from 'graphql-tag'

export default {
  name: 'Home',
  apollo: {
    user: {
      query: gql ` query { user { name id } } `
    }
  },
  data: ( ) => ( {
    user: { name: null, id: null }
  } )
}
</script>