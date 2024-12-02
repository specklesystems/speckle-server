<template>
  <div>
    <p class="text-body-xs">
      The application grant type should be set to "authorization_code." Below is a list
      of supported scopes and claims to configure in the application:
    </p>
    <div class="mb-8 bg-foundation border border-outline-3 rounded-lg p-4 text-body-xs">
      <div class="grid grid-cols-3 gap-y-1.5">
        <div class="col-span-1 font-medium">Scope</div>
        <div class="col-span-2 font-medium">Resultant claims</div>

        <template v-for="(claims, scope) in scopesAndClaims" :key="scope">
          <div class="col-span-1">{{ scope }}</div>
          <div class="col-span-2">{{ claims }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const scopesAndClaims = ref({
  openid: '-',
  profile: 'name, given_name, family_name',
  email: 'email'
})
</script>
