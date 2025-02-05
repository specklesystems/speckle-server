<template>
  <div class="latest-blogposts">
    <v-card rounded="lg" style="overflow: hidden" class="transparent elevation-0 pb-4">
      <v-toolbar class="mt-0" rounded="lg" dense>
        <v-toolbar-title class="body-2 font-weight-bold">
          <a
            class="text-decoration-none"
            href="https://github.com/specklesystems/speckle-server"
            target="_blank"
          >
            Star Speckle on Github!
          </a>
        </v-toolbar-title>
        <v-spacer />
        <v-app-bar-nav-icon
          href="https://github.com/specklesystems/speckle-server"
          target="_blank"
        >
          <v-icon small class="yellow--text">mdi-star</v-icon>
        </v-app-bar-nav-icon>
      </v-toolbar>
      <v-toolbar class="mt-3" rounded="lg" dense>
        <v-toolbar-title class="body-2 font-weight-bold">Tutorials</v-toolbar-title>
        <v-spacer />
        <v-app-bar-nav-icon href="https://speckle.systems/tutorials" target="_blank">
          <v-icon small>mdi-open-in-new</v-icon>
        </v-app-bar-nav-icon>
      </v-toolbar>
      <div v-for="post in posts" :key="post.uuid">
        <v-hover v-slot="{ hover }">
          <v-card
            class="my-4"
            :elevation="hover ? 16 : 2"
            :href="post.url"
            :target="'_blank'"
          >
            <v-img
              :src="post.feature_image"
              height="100"
              :gradient="`to top right, ${
                $vuetify.theme.dark
                  ? 'rgba(100,115,201,.33), rgba(25,32,72,.7)'
                  : 'rgba(100,115,231,.15), rgba(25,32,72,.05)'
              }`"
            ></v-img>
            <v-toolbar flat>
              <v-toolbar-title class="body-2">
                <a :href="post.url" target="_blank" class="text-decoration-none">
                  <b>{{ post.title }}</b>
                </a>
                <br />
                <div class="caption grey--text">
                  {{ post.excerpt }}
                </div>
              </v-toolbar-title>
              <v-spacer />
              <v-btn icon :href="post.url" target="_blank">
                <v-icon small>mdi-open-in-new</v-icon>
              </v-btn>
              <v-spacer></v-spacer>
            </v-toolbar>
          </v-card>
        </v-hover>
      </div>
      <v-toolbar class="my-4" rounded="lg" dense flat>
        <v-toolbar-title class="body-2">
          <a
            href="https://speckle.systems/tutorials"
            target="_blank"
            class="text-decoration-none"
          >
            More Tutorials
          </a>
        </v-toolbar-title>
        <v-btn icon href="https://speckle.systems/tutorials" target="_blank">
          <v-icon small>mdi-arrow-right</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card rounded="lg" class="mt-2">
        <v-card-text class="caption">
          <p class="mb-0">
            At
            <a
              href="https://speckle.systems"
              target="_blank"
              class="text-decoration-none"
            >
              Speckle
            </a>
            we're working tirelessly to bring you the best open source data platform for
            AEC. Tell us what you think on our
            <a
              href="https://speckle.community"
              target="_blank"
              class="text-decoration-none"
            >
              forum
            </a>
            , and don't forget to give us a ⭐️ on
            <a
              href="https://github.com/specklesystems/speckle-sharp"
              target="_blank"
              class="text-decoration-none"
            >
              Github
            </a>
            !
          </p>
        </v-card-text>
      </v-card>
    </v-card>
  </div>
</template>
<script>
import GhostContentAPI from '@tryghost/content-api'

export default {
  data() {
    return {
      posts: []
    }
  },
  mounted() {
    this.api = new GhostContentAPI({
      url: 'https://v1.speckle.systems',
      key: 'bf4ca76b9606d0c13b0edf5dc1',
      version: 'v3'
    })

    this.api.posts
      .browse({
        filter: 'tags:[tutorials,blog]',
        limit: 7
      })
      .then((posts) => {
        this.posts = posts
      })
      .catch((err) => {
        this.$eventHub.$emit('notification', {
          text: err.message
        })
      })
  }
}
</script>
<style lang="scss" scoped>
.latest-blogposts {
  width: 240px;
}
</style>
