
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>
type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)
interface _GlobalComponents {
      'AuthSignInFlow': typeof import("../components/auth/SignInFlow.vue")['default']
    'BaseThemeSwitcher': typeof import("../components/base/ThemeSwitcher.vue")['default']
    'CanvasCard': typeof import("../components/canvas/Card.vue")['default']
    'CanvasInfinite': typeof import("../components/canvas/Infinite.vue")['default']
    'CanvasPaper': typeof import("../components/canvas/Paper.vue")['default']
    'CanvasSandbox': typeof import("../components/canvas/Sandbox.vue")['default']
    'CanvasToolbar': typeof import("../components/canvas/Toolbar.vue")['default']
    'CanvasPaperLogoBlock': typeof import("../components/canvas/paper/LogoBlock.vue")['default']
    'CanvasPaperStaticLayer': typeof import("../components/canvas/paper/StaticLayer.vue")['default']
    'CanvasViewerContainer': typeof import("../components/canvas/viewer/Container.vue")['default']
    'CanvasViewerStaticLayer': typeof import("../components/canvas/viewer/StaticLayer.vue")['default']
    'HeaderLogoBlock': typeof import("../components/header/LogoBlock.vue")['default']
    'HeaderNavBar': typeof import("../components/header/NavBar.vue")['default']
    'HeaderNavBarEmpty': typeof import("../components/header/NavBarEmpty.vue")['default']
    'UserAvatar': typeof import("../components/user/Avatar.vue")['default']
    'UserMenu': typeof import("../components/user/Menu.vue")['default']
    'ViewerBase': typeof import("../components/viewer/Base.vue")['default']
    'ViewerBaseOld': typeof import("../components/viewer/BaseOld.vue")['default']
    'ViewerContainer': typeof import("../components/viewer/Container.vue")['default']
    'NuxtWelcome': typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
    'ClientOnly': typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtTime': typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
    'NuxtPicture': typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
    'ColorScheme': typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']
    'CommonAlert': typeof import("@speckle/ui-components")['CommonAlert']
    'CommonAnimationInstructional': typeof import("@speckle/ui-components")['CommonAnimationInstructional']
    'CommonBadge': typeof import("@speckle/ui-components")['CommonBadge']
    'CommonLoadingBar': typeof import("@speckle/ui-components")['CommonLoadingBar']
    'CommonLoadingIcon': typeof import("@speckle/ui-components")['CommonLoadingIcon']
    'CommonProgressBar': typeof import("@speckle/ui-components")['CommonProgressBar']
    'CommonPromoAlert': typeof import("@speckle/ui-components")['CommonPromoAlert']
    'CommonStepsBullet': typeof import("@speckle/ui-components")['CommonStepsBullet']
    'CommonStepsNumber': typeof import("@speckle/ui-components")['CommonStepsNumber']
    'CommonTextLink': typeof import("@speckle/ui-components")['CommonTextLink']
    'CommonVimeoEmbed': typeof import("@speckle/ui-components")['CommonVimeoEmbed']
    'FormButton': typeof import("@speckle/ui-components")['FormButton']
    'FormCardButton': typeof import("@speckle/ui-components")['FormCardButton']
    'FormCheckbox': typeof import("@speckle/ui-components")['FormCheckbox']
    'FormClipboardInput': typeof import("@speckle/ui-components")['FormClipboardInput']
    'FormCodeInput': typeof import("@speckle/ui-components")['FormCodeInput']
    'FormDualRange': typeof import("@speckle/ui-components")['FormDualRange']
    'FormFileUploadZone': typeof import("@speckle/ui-components")['FormFileUploadZone']
    'FormRadio': typeof import("@speckle/ui-components")['FormRadio']
    'FormRadioGroup': typeof import("@speckle/ui-components")['FormRadioGroup']
    'FormRange': typeof import("@speckle/ui-components")['FormRange']
    'FormSelectBadges': typeof import("@speckle/ui-components")['FormSelectBadges']
    'FormSelectBase': typeof import("@speckle/ui-components")['FormSelectBase']
    'FormSelectMulti': typeof import("@speckle/ui-components")['FormSelectMulti']
    'FormSelectSourceApps': typeof import("@speckle/ui-components")['FormSelectSourceApps']
    'FormSwitch': typeof import("@speckle/ui-components")['FormSwitch']
    'FormTags': typeof import("@speckle/ui-components")['FormTags']
    'FormTextArea': typeof import("@speckle/ui-components")['FormTextArea']
    'FormTextInput': typeof import("@speckle/ui-components")['FormTextInput']
    'GlobalToastRenderer': typeof import("@speckle/ui-components")['GlobalToastRenderer']
    'InfiniteLoading': typeof import("@speckle/ui-components")['InfiniteLoading']
    'LayoutDialog': typeof import("@speckle/ui-components")['LayoutDialog']
    'LayoutDialogSection': typeof import("@speckle/ui-components")['LayoutDialogSection']
    'LayoutDisclosure': typeof import("@speckle/ui-components")['LayoutDisclosure']
    'LayoutGridListToggle': typeof import("@speckle/ui-components")['LayoutGridListToggle']
    'LayoutMenu': typeof import("@speckle/ui-components")['LayoutMenu']
    'LayoutPanel': typeof import("@speckle/ui-components")['LayoutPanel']
    'LayoutSidebarMenuGroup': typeof import("@speckle/ui-components")['LayoutSidebarMenuGroup']
    'LayoutSidebarMenuGroupItem': typeof import("@speckle/ui-components")['LayoutSidebarMenuGroupItem']
    'LayoutSidebarPromo': typeof import("@speckle/ui-components")['LayoutSidebarPromo']
    'LayoutTable': typeof import("@speckle/ui-components")['LayoutTable']
    'LayoutTabsHorizontal': typeof import("@speckle/ui-components")['LayoutTabsHorizontal']
    'LayoutTabsVertical': typeof import("@speckle/ui-components")['LayoutTabsVertical']
    'SourceAppBadge': typeof import("@speckle/ui-components")['SourceAppBadge']
    'UserAvatarEditable': typeof import("@speckle/ui-components")['UserAvatarEditable']
    'UserAvatarGroup': typeof import("@speckle/ui-components")['UserAvatarGroup']
    'NuxtPage': typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
      'LazyAuthSignInFlow': LazyComponent<typeof import("../components/auth/SignInFlow.vue")['default']>
    'LazyBaseThemeSwitcher': LazyComponent<typeof import("../components/base/ThemeSwitcher.vue")['default']>
    'LazyCanvasCard': LazyComponent<typeof import("../components/canvas/Card.vue")['default']>
    'LazyCanvasInfinite': LazyComponent<typeof import("../components/canvas/Infinite.vue")['default']>
    'LazyCanvasPaper': LazyComponent<typeof import("../components/canvas/Paper.vue")['default']>
    'LazyCanvasSandbox': LazyComponent<typeof import("../components/canvas/Sandbox.vue")['default']>
    'LazyCanvasToolbar': LazyComponent<typeof import("../components/canvas/Toolbar.vue")['default']>
    'LazyCanvasPaperLogoBlock': LazyComponent<typeof import("../components/canvas/paper/LogoBlock.vue")['default']>
    'LazyCanvasPaperStaticLayer': LazyComponent<typeof import("../components/canvas/paper/StaticLayer.vue")['default']>
    'LazyCanvasViewerContainer': LazyComponent<typeof import("../components/canvas/viewer/Container.vue")['default']>
    'LazyCanvasViewerStaticLayer': LazyComponent<typeof import("../components/canvas/viewer/StaticLayer.vue")['default']>
    'LazyHeaderLogoBlock': LazyComponent<typeof import("../components/header/LogoBlock.vue")['default']>
    'LazyHeaderNavBar': LazyComponent<typeof import("../components/header/NavBar.vue")['default']>
    'LazyHeaderNavBarEmpty': LazyComponent<typeof import("../components/header/NavBarEmpty.vue")['default']>
    'LazyUserAvatar': LazyComponent<typeof import("../components/user/Avatar.vue")['default']>
    'LazyUserMenu': LazyComponent<typeof import("../components/user/Menu.vue")['default']>
    'LazyViewerBase': LazyComponent<typeof import("../components/viewer/Base.vue")['default']>
    'LazyViewerBaseOld': LazyComponent<typeof import("../components/viewer/BaseOld.vue")['default']>
    'LazyViewerContainer': LazyComponent<typeof import("../components/viewer/Container.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtTime': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
    'LazyNuxtPicture': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
    'LazyColorScheme': LazyComponent<typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']>
    'LazyCommonAlert': LazyComponent<typeof import("@speckle/ui-components")['CommonAlert']>
    'LazyCommonAnimationInstructional': LazyComponent<typeof import("@speckle/ui-components")['CommonAnimationInstructional']>
    'LazyCommonBadge': LazyComponent<typeof import("@speckle/ui-components")['CommonBadge']>
    'LazyCommonLoadingBar': LazyComponent<typeof import("@speckle/ui-components")['CommonLoadingBar']>
    'LazyCommonLoadingIcon': LazyComponent<typeof import("@speckle/ui-components")['CommonLoadingIcon']>
    'LazyCommonProgressBar': LazyComponent<typeof import("@speckle/ui-components")['CommonProgressBar']>
    'LazyCommonPromoAlert': LazyComponent<typeof import("@speckle/ui-components")['CommonPromoAlert']>
    'LazyCommonStepsBullet': LazyComponent<typeof import("@speckle/ui-components")['CommonStepsBullet']>
    'LazyCommonStepsNumber': LazyComponent<typeof import("@speckle/ui-components")['CommonStepsNumber']>
    'LazyCommonTextLink': LazyComponent<typeof import("@speckle/ui-components")['CommonTextLink']>
    'LazyCommonVimeoEmbed': LazyComponent<typeof import("@speckle/ui-components")['CommonVimeoEmbed']>
    'LazyFormButton': LazyComponent<typeof import("@speckle/ui-components")['FormButton']>
    'LazyFormCardButton': LazyComponent<typeof import("@speckle/ui-components")['FormCardButton']>
    'LazyFormCheckbox': LazyComponent<typeof import("@speckle/ui-components")['FormCheckbox']>
    'LazyFormClipboardInput': LazyComponent<typeof import("@speckle/ui-components")['FormClipboardInput']>
    'LazyFormCodeInput': LazyComponent<typeof import("@speckle/ui-components")['FormCodeInput']>
    'LazyFormDualRange': LazyComponent<typeof import("@speckle/ui-components")['FormDualRange']>
    'LazyFormFileUploadZone': LazyComponent<typeof import("@speckle/ui-components")['FormFileUploadZone']>
    'LazyFormRadio': LazyComponent<typeof import("@speckle/ui-components")['FormRadio']>
    'LazyFormRadioGroup': LazyComponent<typeof import("@speckle/ui-components")['FormRadioGroup']>
    'LazyFormRange': LazyComponent<typeof import("@speckle/ui-components")['FormRange']>
    'LazyFormSelectBadges': LazyComponent<typeof import("@speckle/ui-components")['FormSelectBadges']>
    'LazyFormSelectBase': LazyComponent<typeof import("@speckle/ui-components")['FormSelectBase']>
    'LazyFormSelectMulti': LazyComponent<typeof import("@speckle/ui-components")['FormSelectMulti']>
    'LazyFormSelectSourceApps': LazyComponent<typeof import("@speckle/ui-components")['FormSelectSourceApps']>
    'LazyFormSwitch': LazyComponent<typeof import("@speckle/ui-components")['FormSwitch']>
    'LazyFormTags': LazyComponent<typeof import("@speckle/ui-components")['FormTags']>
    'LazyFormTextArea': LazyComponent<typeof import("@speckle/ui-components")['FormTextArea']>
    'LazyFormTextInput': LazyComponent<typeof import("@speckle/ui-components")['FormTextInput']>
    'LazyGlobalToastRenderer': LazyComponent<typeof import("@speckle/ui-components")['GlobalToastRenderer']>
    'LazyInfiniteLoading': LazyComponent<typeof import("@speckle/ui-components")['InfiniteLoading']>
    'LazyLayoutDialog': LazyComponent<typeof import("@speckle/ui-components")['LayoutDialog']>
    'LazyLayoutDialogSection': LazyComponent<typeof import("@speckle/ui-components")['LayoutDialogSection']>
    'LazyLayoutDisclosure': LazyComponent<typeof import("@speckle/ui-components")['LayoutDisclosure']>
    'LazyLayoutGridListToggle': LazyComponent<typeof import("@speckle/ui-components")['LayoutGridListToggle']>
    'LazyLayoutMenu': LazyComponent<typeof import("@speckle/ui-components")['LayoutMenu']>
    'LazyLayoutPanel': LazyComponent<typeof import("@speckle/ui-components")['LayoutPanel']>
    'LazyLayoutSidebarMenuGroup': LazyComponent<typeof import("@speckle/ui-components")['LayoutSidebarMenuGroup']>
    'LazyLayoutSidebarMenuGroupItem': LazyComponent<typeof import("@speckle/ui-components")['LayoutSidebarMenuGroupItem']>
    'LazyLayoutSidebarPromo': LazyComponent<typeof import("@speckle/ui-components")['LayoutSidebarPromo']>
    'LazyLayoutTable': LazyComponent<typeof import("@speckle/ui-components")['LayoutTable']>
    'LazyLayoutTabsHorizontal': LazyComponent<typeof import("@speckle/ui-components")['LayoutTabsHorizontal']>
    'LazyLayoutTabsVertical': LazyComponent<typeof import("@speckle/ui-components")['LayoutTabsVertical']>
    'LazySourceAppBadge': LazyComponent<typeof import("@speckle/ui-components")['SourceAppBadge']>
    'LazyUserAvatarEditable': LazyComponent<typeof import("@speckle/ui-components")['UserAvatarEditable']>
    'LazyUserAvatarGroup': LazyComponent<typeof import("@speckle/ui-components")['UserAvatarGroup']>
    'LazyNuxtPage': LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export const AuthSignInFlow: typeof import("../components/auth/SignInFlow.vue")['default']
export const BaseThemeSwitcher: typeof import("../components/base/ThemeSwitcher.vue")['default']
export const CanvasCard: typeof import("../components/canvas/Card.vue")['default']
export const CanvasInfinite: typeof import("../components/canvas/Infinite.vue")['default']
export const CanvasPaper: typeof import("../components/canvas/Paper.vue")['default']
export const CanvasSandbox: typeof import("../components/canvas/Sandbox.vue")['default']
export const CanvasToolbar: typeof import("../components/canvas/Toolbar.vue")['default']
export const CanvasPaperLogoBlock: typeof import("../components/canvas/paper/LogoBlock.vue")['default']
export const CanvasPaperStaticLayer: typeof import("../components/canvas/paper/StaticLayer.vue")['default']
export const CanvasViewerContainer: typeof import("../components/canvas/viewer/Container.vue")['default']
export const CanvasViewerStaticLayer: typeof import("../components/canvas/viewer/StaticLayer.vue")['default']
export const HeaderLogoBlock: typeof import("../components/header/LogoBlock.vue")['default']
export const HeaderNavBar: typeof import("../components/header/NavBar.vue")['default']
export const HeaderNavBarEmpty: typeof import("../components/header/NavBarEmpty.vue")['default']
export const UserAvatar: typeof import("../components/user/Avatar.vue")['default']
export const UserMenu: typeof import("../components/user/Menu.vue")['default']
export const ViewerBase: typeof import("../components/viewer/Base.vue")['default']
export const ViewerBaseOld: typeof import("../components/viewer/BaseOld.vue")['default']
export const ViewerContainer: typeof import("../components/viewer/Container.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const ColorScheme: typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']
export const CommonAlert: typeof import("@speckle/ui-components")['CommonAlert']
export const CommonAnimationInstructional: typeof import("@speckle/ui-components")['CommonAnimationInstructional']
export const CommonBadge: typeof import("@speckle/ui-components")['CommonBadge']
export const CommonLoadingBar: typeof import("@speckle/ui-components")['CommonLoadingBar']
export const CommonLoadingIcon: typeof import("@speckle/ui-components")['CommonLoadingIcon']
export const CommonProgressBar: typeof import("@speckle/ui-components")['CommonProgressBar']
export const CommonPromoAlert: typeof import("@speckle/ui-components")['CommonPromoAlert']
export const CommonStepsBullet: typeof import("@speckle/ui-components")['CommonStepsBullet']
export const CommonStepsNumber: typeof import("@speckle/ui-components")['CommonStepsNumber']
export const CommonTextLink: typeof import("@speckle/ui-components")['CommonTextLink']
export const CommonVimeoEmbed: typeof import("@speckle/ui-components")['CommonVimeoEmbed']
export const FormButton: typeof import("@speckle/ui-components")['FormButton']
export const FormCardButton: typeof import("@speckle/ui-components")['FormCardButton']
export const FormCheckbox: typeof import("@speckle/ui-components")['FormCheckbox']
export const FormClipboardInput: typeof import("@speckle/ui-components")['FormClipboardInput']
export const FormCodeInput: typeof import("@speckle/ui-components")['FormCodeInput']
export const FormDualRange: typeof import("@speckle/ui-components")['FormDualRange']
export const FormFileUploadZone: typeof import("@speckle/ui-components")['FormFileUploadZone']
export const FormRadio: typeof import("@speckle/ui-components")['FormRadio']
export const FormRadioGroup: typeof import("@speckle/ui-components")['FormRadioGroup']
export const FormRange: typeof import("@speckle/ui-components")['FormRange']
export const FormSelectBadges: typeof import("@speckle/ui-components")['FormSelectBadges']
export const FormSelectBase: typeof import("@speckle/ui-components")['FormSelectBase']
export const FormSelectMulti: typeof import("@speckle/ui-components")['FormSelectMulti']
export const FormSelectSourceApps: typeof import("@speckle/ui-components")['FormSelectSourceApps']
export const FormSwitch: typeof import("@speckle/ui-components")['FormSwitch']
export const FormTags: typeof import("@speckle/ui-components")['FormTags']
export const FormTextArea: typeof import("@speckle/ui-components")['FormTextArea']
export const FormTextInput: typeof import("@speckle/ui-components")['FormTextInput']
export const GlobalToastRenderer: typeof import("@speckle/ui-components")['GlobalToastRenderer']
export const InfiniteLoading: typeof import("@speckle/ui-components")['InfiniteLoading']
export const LayoutDialog: typeof import("@speckle/ui-components")['LayoutDialog']
export const LayoutDialogSection: typeof import("@speckle/ui-components")['LayoutDialogSection']
export const LayoutDisclosure: typeof import("@speckle/ui-components")['LayoutDisclosure']
export const LayoutGridListToggle: typeof import("@speckle/ui-components")['LayoutGridListToggle']
export const LayoutMenu: typeof import("@speckle/ui-components")['LayoutMenu']
export const LayoutPanel: typeof import("@speckle/ui-components")['LayoutPanel']
export const LayoutSidebarMenuGroup: typeof import("@speckle/ui-components")['LayoutSidebarMenuGroup']
export const LayoutSidebarMenuGroupItem: typeof import("@speckle/ui-components")['LayoutSidebarMenuGroupItem']
export const LayoutSidebarPromo: typeof import("@speckle/ui-components")['LayoutSidebarPromo']
export const LayoutTable: typeof import("@speckle/ui-components")['LayoutTable']
export const LayoutTabsHorizontal: typeof import("@speckle/ui-components")['LayoutTabsHorizontal']
export const LayoutTabsVertical: typeof import("@speckle/ui-components")['LayoutTabsVertical']
export const SourceAppBadge: typeof import("@speckle/ui-components")['SourceAppBadge']
export const UserAvatarEditable: typeof import("@speckle/ui-components")['UserAvatarEditable']
export const UserAvatarGroup: typeof import("@speckle/ui-components")['UserAvatarGroup']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const LazyAuthSignInFlow: LazyComponent<typeof import("../components/auth/SignInFlow.vue")['default']>
export const LazyBaseThemeSwitcher: LazyComponent<typeof import("../components/base/ThemeSwitcher.vue")['default']>
export const LazyCanvasCard: LazyComponent<typeof import("../components/canvas/Card.vue")['default']>
export const LazyCanvasInfinite: LazyComponent<typeof import("../components/canvas/Infinite.vue")['default']>
export const LazyCanvasPaper: LazyComponent<typeof import("../components/canvas/Paper.vue")['default']>
export const LazyCanvasSandbox: LazyComponent<typeof import("../components/canvas/Sandbox.vue")['default']>
export const LazyCanvasToolbar: LazyComponent<typeof import("../components/canvas/Toolbar.vue")['default']>
export const LazyCanvasPaperLogoBlock: LazyComponent<typeof import("../components/canvas/paper/LogoBlock.vue")['default']>
export const LazyCanvasPaperStaticLayer: LazyComponent<typeof import("../components/canvas/paper/StaticLayer.vue")['default']>
export const LazyCanvasViewerContainer: LazyComponent<typeof import("../components/canvas/viewer/Container.vue")['default']>
export const LazyCanvasViewerStaticLayer: LazyComponent<typeof import("../components/canvas/viewer/StaticLayer.vue")['default']>
export const LazyHeaderLogoBlock: LazyComponent<typeof import("../components/header/LogoBlock.vue")['default']>
export const LazyHeaderNavBar: LazyComponent<typeof import("../components/header/NavBar.vue")['default']>
export const LazyHeaderNavBarEmpty: LazyComponent<typeof import("../components/header/NavBarEmpty.vue")['default']>
export const LazyUserAvatar: LazyComponent<typeof import("../components/user/Avatar.vue")['default']>
export const LazyUserMenu: LazyComponent<typeof import("../components/user/Menu.vue")['default']>
export const LazyViewerBase: LazyComponent<typeof import("../components/viewer/Base.vue")['default']>
export const LazyViewerBaseOld: LazyComponent<typeof import("../components/viewer/BaseOld.vue")['default']>
export const LazyViewerContainer: LazyComponent<typeof import("../components/viewer/Container.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyColorScheme: LazyComponent<typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']>
export const LazyCommonAlert: LazyComponent<typeof import("@speckle/ui-components")['CommonAlert']>
export const LazyCommonAnimationInstructional: LazyComponent<typeof import("@speckle/ui-components")['CommonAnimationInstructional']>
export const LazyCommonBadge: LazyComponent<typeof import("@speckle/ui-components")['CommonBadge']>
export const LazyCommonLoadingBar: LazyComponent<typeof import("@speckle/ui-components")['CommonLoadingBar']>
export const LazyCommonLoadingIcon: LazyComponent<typeof import("@speckle/ui-components")['CommonLoadingIcon']>
export const LazyCommonProgressBar: LazyComponent<typeof import("@speckle/ui-components")['CommonProgressBar']>
export const LazyCommonPromoAlert: LazyComponent<typeof import("@speckle/ui-components")['CommonPromoAlert']>
export const LazyCommonStepsBullet: LazyComponent<typeof import("@speckle/ui-components")['CommonStepsBullet']>
export const LazyCommonStepsNumber: LazyComponent<typeof import("@speckle/ui-components")['CommonStepsNumber']>
export const LazyCommonTextLink: LazyComponent<typeof import("@speckle/ui-components")['CommonTextLink']>
export const LazyCommonVimeoEmbed: LazyComponent<typeof import("@speckle/ui-components")['CommonVimeoEmbed']>
export const LazyFormButton: LazyComponent<typeof import("@speckle/ui-components")['FormButton']>
export const LazyFormCardButton: LazyComponent<typeof import("@speckle/ui-components")['FormCardButton']>
export const LazyFormCheckbox: LazyComponent<typeof import("@speckle/ui-components")['FormCheckbox']>
export const LazyFormClipboardInput: LazyComponent<typeof import("@speckle/ui-components")['FormClipboardInput']>
export const LazyFormCodeInput: LazyComponent<typeof import("@speckle/ui-components")['FormCodeInput']>
export const LazyFormDualRange: LazyComponent<typeof import("@speckle/ui-components")['FormDualRange']>
export const LazyFormFileUploadZone: LazyComponent<typeof import("@speckle/ui-components")['FormFileUploadZone']>
export const LazyFormRadio: LazyComponent<typeof import("@speckle/ui-components")['FormRadio']>
export const LazyFormRadioGroup: LazyComponent<typeof import("@speckle/ui-components")['FormRadioGroup']>
export const LazyFormRange: LazyComponent<typeof import("@speckle/ui-components")['FormRange']>
export const LazyFormSelectBadges: LazyComponent<typeof import("@speckle/ui-components")['FormSelectBadges']>
export const LazyFormSelectBase: LazyComponent<typeof import("@speckle/ui-components")['FormSelectBase']>
export const LazyFormSelectMulti: LazyComponent<typeof import("@speckle/ui-components")['FormSelectMulti']>
export const LazyFormSelectSourceApps: LazyComponent<typeof import("@speckle/ui-components")['FormSelectSourceApps']>
export const LazyFormSwitch: LazyComponent<typeof import("@speckle/ui-components")['FormSwitch']>
export const LazyFormTags: LazyComponent<typeof import("@speckle/ui-components")['FormTags']>
export const LazyFormTextArea: LazyComponent<typeof import("@speckle/ui-components")['FormTextArea']>
export const LazyFormTextInput: LazyComponent<typeof import("@speckle/ui-components")['FormTextInput']>
export const LazyGlobalToastRenderer: LazyComponent<typeof import("@speckle/ui-components")['GlobalToastRenderer']>
export const LazyInfiniteLoading: LazyComponent<typeof import("@speckle/ui-components")['InfiniteLoading']>
export const LazyLayoutDialog: LazyComponent<typeof import("@speckle/ui-components")['LayoutDialog']>
export const LazyLayoutDialogSection: LazyComponent<typeof import("@speckle/ui-components")['LayoutDialogSection']>
export const LazyLayoutDisclosure: LazyComponent<typeof import("@speckle/ui-components")['LayoutDisclosure']>
export const LazyLayoutGridListToggle: LazyComponent<typeof import("@speckle/ui-components")['LayoutGridListToggle']>
export const LazyLayoutMenu: LazyComponent<typeof import("@speckle/ui-components")['LayoutMenu']>
export const LazyLayoutPanel: LazyComponent<typeof import("@speckle/ui-components")['LayoutPanel']>
export const LazyLayoutSidebarMenuGroup: LazyComponent<typeof import("@speckle/ui-components")['LayoutSidebarMenuGroup']>
export const LazyLayoutSidebarMenuGroupItem: LazyComponent<typeof import("@speckle/ui-components")['LayoutSidebarMenuGroupItem']>
export const LazyLayoutSidebarPromo: LazyComponent<typeof import("@speckle/ui-components")['LayoutSidebarPromo']>
export const LazyLayoutTable: LazyComponent<typeof import("@speckle/ui-components")['LayoutTable']>
export const LazyLayoutTabsHorizontal: LazyComponent<typeof import("@speckle/ui-components")['LayoutTabsHorizontal']>
export const LazyLayoutTabsVertical: LazyComponent<typeof import("@speckle/ui-components")['LayoutTabsVertical']>
export const LazySourceAppBadge: LazyComponent<typeof import("@speckle/ui-components")['SourceAppBadge']>
export const LazyUserAvatarEditable: LazyComponent<typeof import("@speckle/ui-components")['UserAvatarEditable']>
export const LazyUserAvatarGroup: LazyComponent<typeof import("@speckle/ui-components")['UserAvatarGroup']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>

export const componentNames: string[]
