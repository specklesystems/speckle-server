<template>
  <div>
    <div
      class="pt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <Portal to="navigation">
        <HeaderNavLink :to="automationFunctionsRoute" :name="'Automate functions'" />
      </Portal>

      <h1 class="text-heading-xl">Automate functions</h1>
      <div class="flex flex-col sm:flex-row gap-2">
        <FormTextInput
          name="search"
          placeholder="Search functions..."
          show-clear
          color="foundation"
          v-bind="bind"
          v-on="on"
        />
        <FormButton
          v-if="canCreateFunction"
          :icon-left="PlusIcon"
          @click="() => (createDialogOpen = true)"
        >
          New Function
        </FormButton>
      </div>
    </div>
    <AutomateFunctionCreateDialog
      v-model:open="createDialogOpen"
      :is-authorized="!!activeUser?.automateInfo.hasAutomateGithubApp"
      :github-orgs="activeUser?.automateInfo.availableGithubOrgs || []"
      :templates="availableTemplates"
    />
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import type { Nullable, Optional } from '@speckle/shared'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionsPageHeader_QueryFragment } from '~/lib/common/generated/gql/graphql'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment AutomateFunctionsPageHeader_Query on Query {
    activeUser {
      id
      automateInfo {
        hasAutomateGithubApp
        availableGithubOrgs
      }
    }
    serverInfo {
      automate {
        availableFunctionTemplates {
          ...AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate
        }
      }
    }
  }
`)

const props = defineProps<{
  activeUser: Optional<AutomateFunctionsPageHeader_QueryFragment['activeUser']>
  serverInfo: Optional<AutomateFunctionsPageHeader_QueryFragment['serverInfo']>
}>()
const search = defineModel<string>('search')

const { on, bind } = useDebouncedTextInput({ model: search })
const { triggerNotification } = useGlobalToast()
const route = useRoute()
const router = useRouter()

const createDialogOpen = ref(false)

const availableTemplates = computed(
  () => props.serverInfo?.automate.availableFunctionTemplates || []
)
const canCreateFunction = computed(
  () => !!props.activeUser?.id && !!availableTemplates.value.length
)

if (import.meta.client) {
  watch(
    () => route.query['ghAuth'] as Nullable<string>,
    (ghAuthVal) => {
      if (!ghAuthVal?.length) return

      if (ghAuthVal === 'success') {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'GitHub authorization successful'
        })
        createDialogOpen.value = true
      } else if (ghAuthVal === 'access_denied') {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'GitHub authorization failed',
          description:
            "You've explicitly denied access to your GitHub account. Please try again."
        })
      } else {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'GitHub authorization failed',
          description:
            (route.query['ghAuthDesc'] as Nullable<string>) ||
            'An unknown issue occurred'
        })
      }

      void router.replace({ query: {} })
    },
    { immediate: true }
  )
}
</script>
