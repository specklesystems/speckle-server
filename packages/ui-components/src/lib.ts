import 'tippy.js/dist/tippy.css'
import './assets/setup/mentions.css'
import GlobalToastRenderer from '~~/src/components/global/ToastRenderer.vue'
import { ToastNotificationType } from '~~/src/helpers/global/toast'
import type { ToastNotification } from '~~/src/helpers/global/toast'
import { keyboardClick } from '~~/src/helpers/global/accessibility'
import FormButton from '~~/src/components/form/Button.vue'
import CommonTextLink from '~~/src/components/common/text/Link.vue'
import CommonBadge from '~~/src/components/common/Badge.vue'
import type {
  BulletStepType,
  NumberStepType,
  HorizontalOrVertical,
  PropAnyComponent,
  AlertColor,
  AlertAction
} from '~~/src/helpers/common/components'
import { TailwindBreakpoints } from '~~/src/helpers/tailwind'
import CommonStepsNumber from '~~/src/components/common/steps/Number.vue'
import CommonStepsBullet from '~~/src/components/common/steps/Bullet.vue'
import CommonAnimationInstructional from '~~/src/components/common/animation/Instructional.vue'
import CommonVimeoEmbed from '~~/src/components/common/VimeoEmbed.vue'
import FormCardButton from '~~/src/components/form/CardButton.vue'
import FormCheckbox from '~~/src/components/form/Checkbox.vue'
import FormRadio from '~~/src/components/form/Radio.vue'
import FormRadioGroup from '~~/src/components/form/RadioGroup.vue'
import FormTextArea from '~~/src/components/form/TextArea.vue'
import FormTextInput from '~~/src/components/form/TextInput.vue'
import * as ValidationHelpers from './helpers/common/validation' // dts plugin bug, hence the relative path
import { useWrappingContainerHiddenCount } from '~~/src/composables/layout/resize'
import { useFormSelectChildInternals } from '~~/src/composables/form/select'
import FormSelectSourceApps from '~~/src/components/form/select/SourceApps.vue'
import FormSelectBase from '~~/src/components/form/select/Base.vue'
import FormSelectBadges from '~~/src/components/form/select/Badges.vue'
import FormSelectMulti from '~~/src/components/form/select/Multi.vue'
import FormSwitch from '~~/src/components/form/Switch.vue'
import FormClipboardInput from '~~/src/components/form/ClipboardInput.vue'
import FormCodeInput from '~~/src/components/form/CodeInput.vue'
import CommonLoadingBar from '~~/src/components/common/loading/Bar.vue'
import SourceAppBadge from '~~/src/components/SourceAppBadge.vue'
import { onKeyboardShortcut, useFormCheckboxModel } from '~~/src/composables/form/input'
import {
  ModifierKeys,
  getKeyboardShortcutTitle,
  clientOs
} from '~~/src/helpers/form/input'
import LayoutDialog from '~~/src/components/layout/Dialog.vue'
import LayoutDialogSection from '~~/src/components/layout/DialogSection.vue'
import LayoutDisclosure from '~~/src/components/layout/Disclosure.vue'
import LayoutGridListToggle from '~~/src/components/layout/GridListToggle.vue'
import type {
  LayoutPageTabItem,
  LayoutDialogButton,
  LayoutHeaderButton
} from '~~/src/helpers/layout/components'
import { GridListToggleValue } from '~~/src/helpers/layout/components'
import {
  ThrottleOrDebounce,
  HorizontalDirection,
  useWindowResizeHandler,
  useOnBeforeWindowUnload,
  useResponsiveHorizontalDirectionCalculation
} from '~~/src/composables/common/window'
import LayoutMenu from '~~/src/components/layout/Menu.vue'
import type { LayoutMenuItem, LayoutTabItem } from '~~/src/helpers/layout/components'
import LayoutTabsHorizontal from '~~/src/components/layout/tabs/Horizontal.vue'
import LayoutTabsVertical from '~~/src/components/layout/tabs/Vertical.vue'
import LayoutTable from '~~/src/components/layout/Table.vue'
import InfiniteLoading from '~~/src/components/InfiniteLoading.vue'
import type { InfiniteLoaderState } from '~~/src/helpers/global/components'
import LayoutPanel from '~~/src/components/layout/Panel.vue'
import LayoutSidebar from '~~/src/components/layout/sidebar/Sidebar.vue'
import LayoutSidebarPromo from '~~/src/components/layout/sidebar/Promo.vue'
import LayoutSidebarMenu from '~~/src/components/layout/sidebar/menu/Menu.vue'
import LayoutSidebarMenuGroup from '~~/src/components/layout/sidebar/menu/group/Group.vue'
import LayoutSidebarMenuGroupItem from '~~/src/components/layout/sidebar/menu/group/Item.vue'
import CommonAlert from '~~/src/components/common/Alert.vue'
import {
  writableAsyncComputed,
  buildManualPromise
} from '~~/src/composables/common/async'
import type {
  AsyncWritableComputedOptions,
  AsyncWritableComputedRef
} from '~~/src/composables/common/async'
import FormTags from '~~/src/components/form/Tags.vue'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import UserAvatarGroup from '~~/src/components/user/AvatarGroup.vue'
import UserAvatarEditable from '~~/src/components/user/AvatarEditable.vue'
import FormFileUploadZone from '~~/src/components/form/file-upload/Zone.vue'
import {
  type UploadableFileItem,
  type UploadFileItem,
  type BlobPostResultItem,
  FileTooLargeError
} from '~~/src/composables/form/fileUpload'
import {
  MissingFileExtensionError,
  ForbiddenFileTypeError,
  UniqueFileTypeSpecifier,
  prettyFileSize,
  resolveFileExtension,
  generateFileId
} from '~~/src/helpers/form/file'
import type { FileTypeSpecifier } from '~~/src/helpers/form/file'
export * from '~~/src/helpers/common/error'
import CommonLoadingIcon from '~~/src/components/common/loading/Icon.vue'
import type { AvatarUser, AvatarUserWithId } from '~~/src/composables/user/avatar'
import { useDebouncedTextInput } from '~~/src/composables/form/textInput'
export { vKeyboardClickable } from '~~/src/directives/accessibility'
export { useAvatarSizeClasses } from '~~/src/composables/user/avatar'
export type { UserAvatarSize } from '~~/src/composables/user/avatar'
import CommonProgressBar from '~~/src/components/common/ProgressBar.vue'
import CommonPromoAlert from '~~/src/components/common/PromoAlert.vue'
import FormRange from '~~/src/components/form/Range.vue'
import FormDualRange from '~~/src/components/form/DualRange.vue'
import type { FormRadioGroupItem } from '~~/src/helpers/common/components'

export {
  CommonPromoAlert,
  MissingFileExtensionError,
  ForbiddenFileTypeError,
  FileTooLargeError,
  CommonLoadingIcon,
  UniqueFileTypeSpecifier,
  prettyFileSize,
  FormFileUploadZone,
  UserAvatar,
  UserAvatarGroup,
  UserAvatarEditable,
  GlobalToastRenderer,
  ToastNotificationType,
  FormButton,
  CommonTextLink,
  CommonBadge,
  TailwindBreakpoints,
  CommonStepsBullet,
  CommonStepsNumber,
  CommonAnimationInstructional,
  CommonVimeoEmbed,
  FormCardButton,
  FormCheckbox,
  FormRadio,
  FormRadioGroup,
  FormTextArea,
  FormTextInput,
  FormSwitch,
  FormClipboardInput,
  FormCodeInput,
  ValidationHelpers,
  useWrappingContainerHiddenCount,
  useFormSelectChildInternals,
  FormSelectBase,
  FormSelectBadges,
  FormSelectSourceApps,
  FormSelectMulti,
  CommonLoadingBar,
  SourceAppBadge,
  onKeyboardShortcut,
  ModifierKeys,
  getKeyboardShortcutTitle,
  clientOs,
  LayoutDialog,
  LayoutDialogSection,
  LayoutDisclosure,
  LayoutGridListToggle,
  GridListToggleValue,
  ThrottleOrDebounce,
  HorizontalDirection,
  useWindowResizeHandler,
  useOnBeforeWindowUnload,
  useResponsiveHorizontalDirectionCalculation,
  LayoutMenu,
  LayoutTabsHorizontal,
  LayoutTabsVertical,
  LayoutTable,
  LayoutSidebar,
  LayoutSidebarPromo,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup,
  LayoutSidebarMenuGroupItem,
  InfiniteLoading,
  LayoutPanel,
  CommonAlert,
  writableAsyncComputed,
  useFormCheckboxModel,
  FormTags,
  keyboardClick,
  useDebouncedTextInput,
  buildManualPromise,
  CommonProgressBar,
  resolveFileExtension,
  generateFileId,
  FormRange,
  FormDualRange
}
export type {
  FormRadioGroupItem,
  LayoutDialogButton,
  LayoutHeaderButton,
  ToastNotification,
  BulletStepType,
  NumberStepType,
  HorizontalOrVertical,
  LayoutMenuItem,
  LayoutTabItem,
  InfiniteLoaderState,
  AsyncWritableComputedOptions,
  AsyncWritableComputedRef,
  UploadFileItem,
  UploadableFileItem,
  BlobPostResultItem,
  FileTypeSpecifier,
  AvatarUser,
  AvatarUserWithId,
  LayoutPageTabItem,
  PropAnyComponent,
  AlertColor,
  AlertAction
}
