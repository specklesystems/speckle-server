<template>
	<div>
		<v-app-bar style="position: absolute; top: 0; width: 100%; z-index: 90" elevation="0">
			<search-bar />
		</v-app-bar>

		<v-list style="margin-top: 64px" shaped>
			<v-list-item class="primary" dark link @click="newStreamDialog = true">
				<v-list-item-content>
					<v-list-item-title>New Stream</v-list-item-title>
					<v-list-item-subtitle class="caption">
						Quickly create a new data repository.
					</v-list-item-subtitle>
				</v-list-item-content>
				<v-list-item-icon>
					<v-icon class="">mdi-plus-box</v-icon>
				</v-list-item-icon>
			</v-list-item>
			<v-list-item link @click="showServerInviteDialog()">
				<v-list-item-content>
					<v-list-item-title>Invite</v-list-item-title>
					<v-list-item-subtitle class="caption">
						Invite a colleague to Speckle!
					</v-list-item-subtitle>
				</v-list-item-content>
				<v-list-item-icon>
					<v-icon class="">mdi-email</v-icon>
				</v-list-item-icon>
			</v-list-item>
		</v-list>

		<server-invite-dialog ref="serverInviteDialog" />
		
		<v-dialog v-model="newStreamDialog" max-width="500" :fullscreen="$vuetify.breakpoint.xsOnly">
			<stream-new-dialog
				:open="newStreamDialog"
				@created="newStreamDialog = false"
				@close="newStreamDialog = false"
			/>
		</v-dialog>
	</div>
</template>
<script>
export default {
	components: {
		ServerInviteDialog: () => import('@/components/dialogs/ServerInviteDialog'),
		StreamNewDialog: () => import('@/components/dialogs/StreamNewDialog'),
		SearchBar: () => import('@/components/SearchBar'),
	},
	props: {
		OpenNewStream: {
			type: Number,
			default: 0
		}
	},
	watch: {
		OpenNewStream(val, old) {
			this.newStreamDialog = true
		}
	},
	data() {
		return {
			newStreamDialog: false
		}
	},
	methods: {
		showServerInviteDialog() {
			this.$refs.serverInviteDialog.show()
		}
	},
	mounted() {}
}
</script>
