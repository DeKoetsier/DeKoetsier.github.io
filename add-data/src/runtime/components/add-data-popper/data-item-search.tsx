/** @jsx jsx */
import { React, jsx, css, SupportedItemTypes as JimuSupportedItemTypes, Immutable, type DataSourceJson, dataSourceUtils, ReactRedux, type IMState, DataSourceStatus, ServiceManager, SupportedLayerServiceTypes, type ImmutableArray, hooks } from 'jimu-core'
import { type IItemWithPortalUrl, ItemSelector, ItemSelectorMode } from 'jimu-ui/basic/item-selector'
import { type ItemCategoryInfo } from '../../../config'

import { type DataOptions } from '../../types'
import { getDsJsonFromSingleLayerServiceDefinition, getNextAddedDataId } from '../../utils'
import { useDefaultLabel } from '../../../utils'
import { defaultMessages as jimuUIMessages } from 'jimu-ui'
import defaultMessages from '../../translations/default'

export interface DataItemSearchProps {
  widgetId: string
  portalUrl: string
  multiDataOptions: DataOptions[]
  nextOrder: number
  itemCategoriesInfo?: ImmutableArray<ItemCategoryInfo>
  onChange: (multiDataOptions: DataOptions[]) => void
}

const { useMemo, useState } = React
const { useSelector } = ReactRedux
const SupportedItemTypes = Immutable([JimuSupportedItemTypes.FeatureService, JimuSupportedItemTypes.MapService, JimuSupportedItemTypes.SceneService, JimuSupportedItemTypes.FeatureCollection, JimuSupportedItemTypes.ImageService, JimuSupportedItemTypes.VectorTileService, JimuSupportedItemTypes.CSV, JimuSupportedItemTypes.GeoJSON, JimuSupportedItemTypes.KML, JimuSupportedItemTypes.WFS, JimuSupportedItemTypes.WMS, JimuSupportedItemTypes.WMTS])

export const DataItemSearch = (props: DataItemSearchProps) => {
  const { widgetId, multiDataOptions, portalUrl, nextOrder, onChange, itemCategoriesInfo } = props
  const dataSourcesInfo = useSelector((state: IMState) => state.dataSourcesInfo)
  const [gettingDataSourceJsonItems, setGettingDataSourceJsonItems] = useState<string[]>([])
  // Loading items are 1. items which are selected and wait for getting data source json of them, and, 2. items which have data source json and wait for creating data source instances for them.
  const loadingItems = useMemo(() => Immutable(multiDataOptions.filter(d => d.dataSourceJson.itemId && dataSourcesInfo?.[d.dataSourceJson.id]?.instanceStatus === DataSourceStatus.NotCreated).map(d => d.dataSourceJson.itemId).concat(gettingDataSourceJsonItems)), [multiDataOptions, dataSourcesInfo, gettingDataSourceJsonItems])

  const selectedItems = useMemo(() => Immutable(multiDataOptions.map(l => l.dataSourceJson.itemId).filter(itemId => !loadingItems.some(loadingItemId => loadingItemId === itemId))), [multiDataOptions, loadingItems])

  const onSelect = async (allSelectedItems: IItemWithPortalUrl[], latestSelectedItem: IItemWithPortalUrl) => {
    setGettingDataSourceJsonItems(gettingDataSourceJsonItems.concat(latestSelectedItem?.id))
    const dataSourceJson = await getDsJsonFromItem(getNextAddedDataId(widgetId, nextOrder), latestSelectedItem)
    setGettingDataSourceJsonItems(gettingDataSourceJsonItems.filter(itemId => itemId !== latestSelectedItem?.id))
    onChange(multiDataOptions.concat({ dataSourceJson, order: nextOrder }).filter(o => !!o.dataSourceJson))
  }

  const onRemove = (allSelectedItems: IItemWithPortalUrl[], latestRemovedItem: IItemWithPortalUrl) => {
    onChange(multiDataOptions.filter(d => d.dataSourceJson.itemId !== latestRemovedItem.id))
  }

  const translate = hooks.useTranslation(jimuUIMessages, defaultMessages)
  const getDefaultLabel = useDefaultLabel(translate)

  const shouldBeDisplayedItemCategoriesInfo = useMemo(() => {
    return itemCategoriesInfo ? itemCategoriesInfo.filter((item) => item.enabled).map((item) => ({ id: item.id, type: item.type, customLabel: item.customLabel || getDefaultLabel(item), curatedFilter: item.curatedFilter })).asMutable() : undefined
  }, [getDefaultLabel, itemCategoriesInfo])

  return <div className='data-item-search w-100 h-100' css={style}>
    <ItemSelector
      mode={ItemSelectorMode.Simple} itemType={SupportedItemTypes} portalUrl={portalUrl} isMultiple={true}
      onSelect={onSelect} onRemove={onRemove}
      selectedItems={selectedItems} loadingItems={loadingItems}
      itemCategoriesInfo={shouldBeDisplayedItemCategoriesInfo}
      disableDetailPopper allowAllSceneService showItemTypeCategoryFilter />
  </div>
}

async function getDsJsonFromItem (dsId: string, item: IItemWithPortalUrl): Promise<DataSourceJson> {
  try {
    if (!item) {
      return Promise.resolve(null)
    }

    /**
     * For feature service item, if it is single layer but the url is not end up with layer id, we need to find the single layer and create a feature layer data source, not feature service data source.
     * This is to make single layer feature service item to support 'set filter' action and 'view in table' action.
     */
    if (item.type === JimuSupportedItemTypes.FeatureService && dataSourceUtils.isSupportedWholeArcGISService(item.url)) {
      const serviceUrl = item.url.split('?')[0].replace(/^http:/, 'https:').replace(/\/$/, '')
      const serviceDefinition = await ServiceManager.getInstance().fetchServiceInfo(serviceUrl).then(res => res.definition)
      const layers = (serviceDefinition?.layers || []).concat(serviceDefinition?.tables || [])
      // If the single layer is not feature layer or table, will still create feature service data source.
      if (layers.length === 1 && ((serviceDefinition?.layers?.length === 1 && serviceDefinition?.layers?.[0]?.type === SupportedLayerServiceTypes.FeatureLayer) || (serviceDefinition?.tables?.length === 1))) {
        return getDsJsonFromSingleLayerServiceDefinition(serviceUrl, serviceDefinition, dsId, item.title, item.id, item.portalUrl)
      }
    }

    return Promise.resolve(dataSourceUtils.getDsJsonFromItem(dsId, item, item.portalUrl).asMutable({ deep: true }))
  } catch (err) {
    console.error('Failed to create data source', err)
    return Promise.resolve(null)
  }
}

const style = css`
  position: relative;
`
