<template>
  <div>
    <Portal to="navigation">
      <template v-if="!!workspace?.slug && !!workspace?.name">
        <HeaderNavLink
          :to="workspaceRoute(workspace.slug)"
          :name="workspace.name"
          :separator="false"
        />
      </template>
      <HeaderNavLink
        :to="workspaceFunctionsRoute(workspace?.slug!)"
        name="Functions"
        :separator="!!workspace"
      />
    </Portal>
    <div class="flex flex-col md:flex-row gap-y-2 md:gap-x-4 md:justify-between">
      <div class="w-full flex flex-row justify-between gap-2">
        <FormTextInput
          name="search"
          placeholder="Search..."
          show-clear
          color="foundation"
          class="grow"
          v-bind="bind"
          v-on="on"
        />
        <FormButton :disabled="!canCreateFunction" @click="createDialogOpen = true">
          New function
        </FormButton>
      </div>
    </div>
    <AutomateFunctionCreateDialog
      v-model:open="createDialogOpen"
      :is-authorized="!!activeUser?.automateInfo.hasAutomateGithubApp"
      :github-orgs="activeUser?.automateInfo.availableGithubOrgs || []"
      :templates="availableTemplates"
      :workspace-id="workspace?.id"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles, type Nullable, type Optional } from '@speckle/shared'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type {
  AutomateFunctionsPageHeader_QueryFragment,
  Workspace
} from '~/lib/common/generated/gql/graphql'
import { workspaceFunctionsRoute, workspaceRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment AutomateFunctionsPageHeader_Query on Query {
    activeUser {
      id
      role
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
  workspace?: Pick<Workspace, 'id' | 'slug' | 'name'>
}>()
const search = defineModel<string>('search')

const { on, bind } = useDebouncedTextInput({ model: search })
const { triggerNotification } = useGlobalToast()
const route = useRoute()
const router = useRouter()
const mixpanel = useMixpanel()

const createDialogOpen = ref(false)

const availableTemplates = computed(
  () => props.serverInfo?.automate.availableFunctionTemplates || []
)
const canCreateFunction = computed(() => {
  return props.workspace
    ? !!props.activeUser?.id && !!availableTemplates.value.length
    : props.activeUser?.role === Roles.Server.Admin
})

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
        mixpanel.track('Automate Finish Authorize GitHub App')
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
  watch(
    () => route.query['automateBetaRedirect'] as Nullable<string>,
    (isRedirect) => {
      if (!isRedirect?.length) return
      mixpanel.track('Automate Beta Visit Redirected')
      const { automateBetaRedirect, ...query } = route.query
      void router.replace({ query })
    },
    { immediate: true }
  )
}
</script>
