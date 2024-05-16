import { type ItemCategory } from 'jimu-ui/basic/item-selector'
import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  disableAddBySearch?: boolean
  disableAddByUrl?: boolean
  disableAddByFile?: boolean
  placeholderText?: string
  itemCategoriesInfo?: ItemCategoryInfo[]
}

export type IMConfig = ImmutableObject<Config>

export interface ItemCategoryInfo {
  type: ItemCategory
  customLabel?: string
  enabled: boolean
  curatedFilter?: string
  id: string
}
