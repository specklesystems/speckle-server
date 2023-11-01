<template>
	<div class="border border-blue-500/10 rounded-md space-y-2">
		<button
			class="flex space-x-1 items-center max-w-full w-full px-1 py-1 h-8 transition hover:bg-primary-muted"
			@click="expanded = !expanded"
		>
			<div>
				<Component
					:is="statusMetaData.icon"
					v-tippy="functionRun.status"
					:class="['h-4 w-4 outline-none', statusMetaData.iconColor]"
				/>
			</div>
			<div
				class="bg-blue-500/10 text-primary font-bold h-4 w-4 rounded-md shrink-0 flex justify-center text-center items-center overflow-hidden"
			>
				<img
					v-if="functionRun.functionLogo"
					:src="functionRun.functionLogo"
					alt="function logo"
				/>
				<span v-else class="text-xs">λ</span>
			</div>

			<div class="font-bold text-xs truncate">
				{{ automationName ? automationName + ' / ' : '' }}{{ functionRun.functionName }}
			</div>

			<div class="h-full">
				<button
					class="hover:bg-primary-muted hover:text-primary flex h-full w-full items-center justify-center rounded"
				>
					<ChevronDownIcon
						:class="`h-3 w-3 transition ${!expanded ? '-rotate-90' : 'rotate-0'}`"
					/>
				</button>
			</div>
		</button>
		<div v-if="expanded" class="px-2 pb-2 space-y-2">
			<!-- Status message -->
			<div class="text-xs font-bold text-foreground-2">Status message:</div>
			<div
				v-if="
					functionRun.status === AutomationRunStatus.Initializing ||
					functionRun.status === AutomationRunStatus.Running
				"
				class="text-xs text-foreground-2 italic"
			>
				Function is {{ functionRun.status.toLowerCase() }}.
			</div>
			<div v-else class="text-xs text-foreground-2 italic">
				{{ functionRun.statusMessage || 'No status message' }}
			</div>

			<!-- Attachments -->
			<div v-if="attachments.length !== 0">
				<div class="text-xs font-bold text-foreground-2">Run attachments:</div>
				<AutomationAttachmentButton
					v-for="id in attachments"
					:key="id"
					:blob-id="id"
					:project-id="projectId"
				/>
			</div>

			<!-- Results -->
			<div
				v-if="
					typedFunctionRun.results &&
					typedFunctionRun.results.values &&
					typedFunctionRun.results.values.objectResults &&
					typedFunctionRun.results.values.objectResults.length !== 0
				"
			>
				<div class="text-xs font-bold text-foreground-2 mb-2">Run results:</div>
				<div class="space-y-1">
					<AutomationViewerResultRowItem
						v-for="(result, index) in typedFunctionRun.results.values.objectResults"
						:key="index"
						:result="result"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import {
	AutomationFunctionRun,
	AutomationRunStatus
} from '~~/lib/common/generated/gql/graphql'
import { resolveStatusMetadata } from '~~/lib/automations/helpers/resolveStatusMetadata'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
const { projectId } = useInjectedViewerState()

type ObjectResult = {
	category: string
	objectIds: string[]
	message: string
	level: 'ERROR' | 'WARNING' | 'INFO'
}

const props = defineProps<{
	functionRun: AutomationFunctionRun
	automationName: string
}>()

const typedFunctionRun = computed(() => {
	return props.functionRun as AutomationFunctionRun & {
		results: { values: { blobIds: string[]; objectResults: ObjectResult[] } }
	}
})

const expanded = ref(false)

const attachments = computed(() => {
	if (
		!typedFunctionRun.value.results ||
		!typedFunctionRun.value.results.values ||
		!typedFunctionRun.value.results.values.blobIds
	)
		return []
	return typedFunctionRun.value.results?.values?.blobIds.filter((b) => !!b)
})

const statusMetaData = resolveStatusMetadata(props.functionRun.status)
</script>
