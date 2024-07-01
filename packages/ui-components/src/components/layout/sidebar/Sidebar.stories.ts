import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutSidebar from '~~/src/components/layout/sidebar/Sidebar.vue'
import LayoutSidebarMenu from '~~/src/components/layout/sidebar/menu/Menu.vue'
import LayoutSidebarMenuGroup from '~~/src/components/layout/sidebar/menu/Group.vue'
import {
  HomeIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  CubeIcon,
  ChatBubbleOvalLeftIcon,
  BoltIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon,
  UsersIcon,
  BookOpenIcon,
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/vue/24/outline'
import { UserIcon } from '@heroicons/vue/24/solid'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import { computed } from 'vue'

const dashboardItems = computed(() => [
  {
    label: 'Dashboard',
    id: 'dashboard',
    to: '/',
    icon: HomeIcon
  },
  { label: 'Projects', id: 'projects', to: '/', icon: Squares2X2Icon },
  {
    label: 'Activity',
    id: 'activity',
    to: '/activity',
    icon: PresentationChartLineIcon
  },
  { label: 'Settings', id: 'settings', to: '/', icon: Cog6ToothIcon }
])

const workspacesItems = computed(() => [
  { label: "Benjamin's space", id: 'default-space', tag: 'Free', to: '/workspace' },
  { label: 'Acme Inc', id: 'profile', to: '/workspace' }
])

const favouritesItems = computed(() => [
  { label: 'Different Houses', id: 'different-houses', to: '', icon: Squares2X2Icon },
  { label: 'Another Project', id: 'another-project', to: '', icon: Squares2X2Icon },
  { label: 'The Palace', id: 'the-palace', to: '', icon: CubeIcon },
  {
    label: 'A discussion title',
    id: 'a-discussion-title',
    to: '',
    icon: ChatBubbleOvalLeftIcon
  },
  { label: 'An automation name', id: 'an-automation-name', to: '', icon: BoltIcon }
])

const resourcesItems = computed(() => [
  {
    label: 'Connectors',
    id: 'connectors',
    to: 'https://speckle.systems/features/connectors/',
    external: true,
    icon: PuzzlePieceIcon
  },
  {
    label: 'Community forum',
    id: 'community-forum',
    to: 'https://speckle.community/',
    external: true,
    icon: UsersIcon
  },
  {
    label: 'Documentation',
    id: 'documentation',
    to: 'https://speckle.guide/',
    external: true,
    icon: BookOpenIcon
  },
  { label: 'Changelog', id: 'changelog', to: '', external: true, icon: HeartIcon },
  {
    label: 'Give us feedback',
    id: 'give-us-feedback',
    to: '',
    icon: ChatBubbleLeftIcon
  }
])

const userSettingsItems = computed(() => [
  {
    label: 'Profile',
    id: 'profile',
    to: '/'
  },
  {
    label: 'Notifications',
    id: 'notifications',
    to: '/'
  }
])

const workspaceSettingsItems = computed(() => [
  {
    label: 'General',
    id: 'general',
    to: '/'
  },
  {
    label: 'Project',
    id: 'project',
    to: '/'
  },
  {
    label: 'Members',
    id: 'members',
    to: '/'
  },
  {
    label: 'Security',
    id: 'security',
    to: '/'
  },
  {
    label: 'Regions',
    id: 'regions',
    to: '/'
  }
])

export default {
  component: LayoutSidebar,
  parameters: {
    docs: {
      description: {
        component: 'This component displays a sidebar with optional exit button.'
      }
    }
  },
  argTypes: {
    items: {
      description: 'Array of items to display in the sidebar'
    },
    title: {
      description: 'Title of the sidebar, displayed at the top if provided'
    },
    exitButtonText: {
      description: 'Text for the exit button at the top of the sidebar'
    },
    onExitButtonClick: {
      description: 'Event emitted when the exit button is clicked',
      type: 'function',
      action: 'exit-button-click'
    },
    collapsible: {
      description: 'Indicates if the sidebar sections are collapsible',
      type: 'boolean'
    }
  }
} as Meta

export const Dashboard: StoryObj = {
  render: (args) => ({
    components: {
      LayoutSidebar,
      LayoutSidebarMenu,
      LayoutSidebarMenuGroup,
      HomeIcon,
      PresentationChartLineIcon,
      Squares2X2Icon,
      CubeIcon,
      ChatBubbleOvalLeftIcon,
      BoltIcon,
      Cog6ToothIcon,
      PuzzlePieceIcon,
      UsersIcon,
      BookOpenIcon,
      HeartIcon,
      ChatBubbleLeftIcon,
      UserAvatar,
      UserIcon
    },
    setup() {
      return {
        args,
        dashboardItems,
        workspacesItems,
        favouritesItems,
        resourcesItems
      }
    },
    template: `
      <LayoutSidebar v-bind="args">
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup :items="dashboardItems" title="Dashboard">
            <template #title-icon>
              <HomeIcon class="size-5" />
            </template>
            <template #projects>
              <Squares2X2Icon class="size-5" />
            </template>
            <template #activity>
              <PresentationChartLineIcon class="size-5" />
            </template>
            <template #settings>
              <Cog6ToothIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>

          <LayoutSidebarMenuGroup collapsible title="Workspaces" :items="workspacesItems">
            <template #title-icon>
              <UserIcon class="size-5" />
            </template>
            <template #default-space>
              <UserAvatar size="sm" hover-effect class="ml-1" />
            </template>
            <template #profile>
              <UserAvatar size="sm" hover-effect class="ml-1" />
            </template>
          </LayoutSidebarMenuGroup>

          <LayoutSidebarMenuGroup title="Favourites" :items="favouritesItems" collapsible>
            <template #title-icon>
              <HeartIcon class="size-5" />
            </template>
            <template #different-houses>
              <Squares2X2Icon class="size-5" />
            </template>
            <template #another-project>
              <Squares2X2Icon class="size-5" />
            </template>
            <template #the-palace>
              <CubeIcon class="size-5" />
            </template>
            <template #a-discussion-title>
              <ChatBubbleOvalLeftIcon class="size-5" />
            </template>
            <template #an-automation-name>
              <BoltIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>

          <LayoutSidebarMenuGroup title="Resources" :items="resourcesItems">
            <template #title-icon>
              <BookOpenIcon class="size-5" />
            </template>
            <template #connectors>
              <PuzzlePieceIcon class="size-5" />
            </template>
            <template #community-forum>
              <UsersIcon class="size-5" />
            </template>
            <template #documentation>
              <BookOpenIcon class="size-5" />
            </template>
            <template #changelog>
              <HeartIcon class="size-5" />
            </template>
            <template #give-us-feedback>
              <ChatBubbleLeftIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
      </LayoutSidebar>
    `
  }),
  args: {
    exitButtonText: 'Exit settings',
    collapsible: true
  }
}

export const Settings: StoryObj = {
  render: (args) => ({
    components: {
      LayoutSidebar,
      LayoutSidebarMenu,
      LayoutSidebarMenuGroup,
      UserIcon
    },
    setup() {
      return {
        args,
        userSettingsItems,
        workspaceSettingsItems
      }
    },
    template: `
      <LayoutSidebar v-bind="args">
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="User Settings" :items="userSettingsItems">
            <template #title-icon>
              <UserIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Workspace Settings" :items="workspaceSettingsItems">
            <template #title-icon>
              <UserIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Server Settings" :items="workspaceSettingsItems">
            <template #title-icon>
              <UserIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Resources" :items="userSettingsItems">
            <template #title-icon>
              <UserIcon class="size-5" />
            </template>
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
      </LayoutSidebar>
    `
  }),
  args: {
    exitButtonText: 'Exit settings',
    collapsible: true
  }
}
