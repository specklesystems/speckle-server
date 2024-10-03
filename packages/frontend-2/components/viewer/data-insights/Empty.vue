<template>
  <div class="m-10">
    <FormButton size="lg" @click="addAnalysis">Add material analysis visual</FormButton>
  </div>
</template>

<script setup lang="ts">
import {
  useCreateAutomation,
  useCreateAutomationRevision,
  useTriggerAutomation
} from '~/lib/projects/composables/automationManagement'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useGlobalToast } from '~~/lib/common/composables/toast'
import { Automate, ensureError } from '@speckle/shared'
import { AutomateRunTriggerType } from '~/lib/common/generated/gql/graphql'

const { projectId } = useInjectedViewerState()
const triggerAutomation = useTriggerAutomation()

const emit = defineEmits<{
  runTriggered: [string]
}>()

const props = defineProps<{
  functionId: string
  functionReleaseId: string
}>()

const { triggerNotification } = useGlobalToast()
const router = useRouter()
const createAutomation = useCreateAutomation()
const createRevision = useCreateAutomationRevision()
const loading = ref(false)
// create automation
// projectId, name, enabled=true
// create revision
// trigger function run
const addAnalysis = async () => {
  try {
    loading.value = true
    const route = router.currentRoute.value.fullPath.split('/')
    const modelId = route[route.indexOf('models') + 1]

    const automation = await createAutomation({
      input: { enabled: true, name: 'Material visuals' },
      projectId: projectId.value
    })
    if (!automation) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to add automation'
      })
      return
      // trigger
    }
    await createRevision({
      projectId: projectId.value,
      input: {
        automationId: automation.id,
        triggerDefinitions: <Automate.AutomateTypes.TriggerDefinitionsSchema>{
          definitions: [
            {
              type: AutomateRunTriggerType.VersionCreated,
              modelId
            }
          ],

          version: Automate.AutomateTypes.TRIGGER_DEFINITIONS_SCHEMA_VERSION
        },
        functions: [
          {
            functionReleaseId: props.functionReleaseId,
            functionId: props.functionId,
            parameters: null
          }
        ]
      }
    })

    const res = await triggerAutomation(projectId.value, automation.id)
    if (!res) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to trigger analysis'
      })
      return
    }
    emit('runTriggered', res)
  } catch (err) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to trigger analysis',
      description: ensureError(err).message
    })
  } finally {
    loading.value = false
  }
}
</script>
