<template>
	<button
		:class="`block transition text-left hover:bg-primary-muted hover:shadow-md rounded-md p-1 cursor-pointer border-l-2  ${
			isIsolated ? 'border-primary bg-primary-muted shadow-md' : 'border-transparent'
		}`"
		@click="isolateOrUnisolateObjects()"
	>
		<div class="flex items-center space-x-1">
			<div>
				<Component :is="iconAndColor.icon" :class="`w-4 h-4 ${iconAndColor.color}`" />
			</div>
			<div :class="`text-xs ${iconAndColor.color}`">
				{{ result.category }}: {{ result.objectIds.length }} affected elements
			</div>
		</div>
		<div class="text-xs text-foreground-2 pl-5">{{ result.message }}</div>
	</button>
</template>
<script setup lang="ts">
import {
	XMarkIcon,
	InformationCircleIcon,
	ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'

type ObjectResult = {
	category: string
	objectIds: string[]
	message: string
	level: 'ERROR' | 'WARNING' | 'INFO'
}

const props = defineProps<{
	result: ObjectResult
}>()

const {
	viewer: {
		metadata: { filteringState }
	}
} = useInjectedViewerState()
const { isolateObjects, unIsolateObjects, resetFilters } = useFilterUtilities()

import { containsAll } from '~~/lib/common/helpers/utils'

const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)
const isIsolated = computed(() => {
	if (!isolatedObjects.value) return false
	const ids = props.result.objectIds
	return containsAll(ids, isolatedObjects.value)
})

const isolateOrUnisolateObjects = () => {
	const ids = props.result.objectIds
	if (!isIsolated.value) {
		resetFilters()
		isolateObjects(ids)
		return
	}

	unIsolateObjects(ids)
}

const iconAndColor = computed(() => {
	switch (props.result.level) {
		case 'ERROR':
			return {
				icon: XMarkIcon,
				color: 'text-danger'
			}
		case 'WARNING':
			return {
				icon: ExclamationTriangleIcon,
				color: 'text-warning'
			}
		case 'INFO':
			return {
				icon: InformationCircleIcon,
				color: 'text-foreground'
			}
	}
	return {
		icon: XMarkIcon,
		color: 'text-danger'
	}
})
</script>
