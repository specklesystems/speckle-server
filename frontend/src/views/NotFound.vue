<template>
  <v-sheet rounded="lg" class="pa-15 text-center">
    <h1>Page not found ಥ_ಥ</h1>
    <img :src="'https://robohash.org/' + $route.path + '.png'" />
    <p class="ma-10 subtitle-1 font-weight-light">
      We can't find the page you're looking for but hey, here's a cool robot!
    </p>
  </v-sheet>
</template>
