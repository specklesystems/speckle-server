export interface IDiscriminatedObject {
  typeDiscriminator: string
}

export class DiscriminatedObject implements IDiscriminatedObject {
  typeDiscriminator: string
  constructor(typeDiscriminator: string) {
    this.typeDiscriminator = typeDiscriminator
  }
}

export interface FormInputBase extends IDiscriminatedObject {
  label?: string
  showLabel?: boolean
}

export interface FormTextInput extends FormInputBase {
  value?: string
  placeholder?: string
}

export interface BooleanValueInput extends FormInputBase {
  value: boolean
}

export interface ListValueInput extends FormInputBase {
  options: ListValueItem[]
  selectedOptions: ListValueInput[]
  multiSelect: boolean
}

export interface ListValueItem extends IDiscriminatedObject {
  id: string
  name: string
  color?: string
}
