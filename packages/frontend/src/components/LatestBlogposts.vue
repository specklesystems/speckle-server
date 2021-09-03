<template>
	<v-card rounded="lg" style="overflow: hidden" class="transparent elevation-0">
		<p class="caption">Latest Tutorials:</p>
		<div v-for="post in posts" :key="post.uuid">
			<v-hover v-slot="{ hover }">
				<v-card class="my-5">
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
				<a href="https://speckle.systems/tutorials" target="_blank" class="text-decoration-none">
					More Tutorials
				</a>
			</v-toolbar-title>
			<v-btn icon href="https://speckle.systems/tutorials" target="_blank">
				<v-icon small>mdi-arrow-right</v-icon>
			</v-btn>
		</v-toolbar>
	</v-card>
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
			url: 'https://speckle.systems',
			key: 'bf4ca76b9606d0c13b0edf5dc1',
			version: 'v3'
		})

		this.api.posts
			.browse({
				filter: 'tag:tutorials',
				limit: 4
			})
			.then((posts) => {
				this.posts = posts
			})
			.catch((err) => {
				console.log(err)
			})
	}
}
</script>
