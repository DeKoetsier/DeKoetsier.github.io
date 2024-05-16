import { ItemCategory } from 'jimu-ui/basic/item-selector'
import { type ItemCategoryInfo } from './config'
import { type ImmutableArray, React, type hooks } from 'jimu-core'

export const getDefaultItemCategoriesInfo = () => {
  return [
    {
      type: ItemCategory.MyContent,
      customLabel: '',
      enabled: true,
      id: ItemCategory.MyContent
    },
    {
      type: ItemCategory.MyGroup,
      customLabel: '',
      enabled: true,
      id: ItemCategory.MyGroup
    },
    {
      type: ItemCategory.MyOrganization,
      customLabel: '',
      enabled: true,
      id: ItemCategory.MyOrganization
    },
    {
      type: ItemCategory.Public,
      customLabel: '',
      enabled: true,
      id: ItemCategory.Public
    },
    {
      type: ItemCategory.LivingAtlas,
      customLabel: '',
      enabled: true,
      id: ItemCategory.LivingAtlas
    }
  ] as ItemCategoryInfo[]
}

export const useCuratedIndex = (itemCategoriesInfo?: ImmutableArray<ItemCategoryInfo>) => {
  return React.useMemo(() => {
    if (!itemCategoriesInfo) {
      return 1
    }
    const curatedIds = itemCategoriesInfo
      .filter((item) => item.type === ItemCategory.Curated)
      .map((item) => item.id)
    if (!curatedIds.length) {
      return 1
    }
    const currentId = Math.max(...curatedIds.map((id) => Number(id.split('_')[1])))
    return currentId + 1
  }, [itemCategoriesInfo])
}

export const useDefaultItemCategoryNames = (translate: ReturnType<typeof hooks.useTranslation>) => {
  return new Map([
    [ItemCategory.MyContent, translate('myContent')],
    [ItemCategory.MyGroup, translate('myGroup')],
    [ItemCategory.MyOrganization, translate('myOrganization')],
    [ItemCategory.Public, translate('public')],
    [ItemCategory.LivingAtlas, translate('livingAtlas')],
    [ItemCategory.Curated, translate('curated')]
  ])
}

// Get default label for curated item category, if type is curated, add index as suffix.
export const useDefaultLabel = (translate: ReturnType<typeof hooks.useTranslation>) => {
  const defaultItemCategoryNames = useDefaultItemCategoryNames(translate)

  return React.useCallback((itemCategoryInfo: ItemCategoryInfo) => {
    const defaultLabel = defaultItemCategoryNames.get(itemCategoryInfo.type)
    if (itemCategoryInfo.type !== ItemCategory.Curated) {
      return defaultLabel
    }
    const index = Number(itemCategoryInfo.id.split('_')?.pop())
    if (!index || index < 2) {
      return defaultLabel
    }
    return `${defaultLabel} ${index}`
  }, [defaultItemCategoryNames])
}
