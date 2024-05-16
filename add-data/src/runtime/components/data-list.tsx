/** @jsx jsx */
import { React, ReactRedux, jsx, css, Immutable, i18n, defaultMessages as jimuCoreMessages, classNames, dataSourceUtils, type IMState, DataSourceStatus, type IMThemeVariables, hooks } from 'jimu-core'
import { Button, defaultMessages as jimuUIMessages, Loading, LoadingType, Icon, Alert, TextInput, DataActionList, DataActionListStyle } from 'jimu-ui'

import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'
import { EditOutlined } from 'jimu-icons/outlined/editor/edit'

import { getDataSource, usePrevious } from '../utils'
import { type DataOptions } from '../types'
import { useTheme } from 'jimu-theme'

export interface DataListProps {
  multiDataOptions: DataOptions[]
  enableDataAction: boolean
  isLoading: boolean
  widgetId: string
  onChangeData: (dataOptions: DataOptions) => void
  onRemoveData: (id: string) => void
}

const { useLayoutEffect, useState, useRef, useMemo } = React
const { useSelector } = ReactRedux

export const DataList = (props: DataListProps) => {
  const { multiDataOptions, enableDataAction, isLoading, onRemoveData, onChangeData, widgetId } = props
  const translate = hooks.useTranslation(jimuUIMessages, jimuCoreMessages)
  const [renamingDataOptions, setRenamingDataOptions] = useState<DataOptions>(null)
  const renamingInputRef = useRef<HTMLInputElement>(null)
  const dssInfo = useSelector((state: IMState) => state.dataSourcesInfo)
  const prevRenamingInputRef = usePrevious(renamingInputRef)
  const intl = i18n.getIntl()

  const theme = useTheme()
  const dataListStyle = useDataListStyle(theme)

  useLayoutEffect(() => {
    // Make rename input focus and default value of the input selected.
    if (renamingDataOptions && renamingInputRef.current && prevRenamingInputRef?.current !== renamingInputRef.current) {
      renamingInputRef.current.focus()
      renamingInputRef.current.select()
    }
  }, [renamingInputRef, prevRenamingInputRef, renamingDataOptions])

  const onRenameData = (dataOptions: DataOptions, label: string) => {
    toggleRenameData(dataOptions)
    onChangeData({
      ...dataOptions,
      dataSourceJson: {
        ...dataOptions.dataSourceJson,
        label
      }
    })
  }

  const toggleRenameData = (dataOptions: DataOptions) => {
    setRenamingDataOptions(renamingDataOptions?.dataSourceJson.id === dataOptions?.dataSourceJson.id ? null : dataOptions)
  }

  return <div className='data-list' css={dataListStyle} role="list">
    {
      multiDataOptions.map((d, i) => {
        const ds = getDataSource(d.dataSourceJson.id)
        const dsInfo = dssInfo?.[d.dataSourceJson.id]
        const isDataError = dsInfo ? dsInfo.instanceStatus === DataSourceStatus.CreateError : !ds && !isLoading
        const isDataLoading = dsInfo ? dsInfo.instanceStatus === DataSourceStatus.NotCreated : !ds && isLoading
        const isRenaming = renamingDataOptions?.dataSourceJson.id === d.dataSourceJson.id
        const label = d.dataSourceJson.label || d.dataSourceJson.sourceLabel
        const isDataActionEnabled = enableDataAction && ds
        return <div key={d.dataSourceJson.id} className={classNames('d-flex justify-content-between align-items-center data-item', { 'pt-12': i !== 0 })} role="listitem" aria-label={label}>
          <div className='flex-grow-1 text-truncate d-flex justify-content-start align-items-center'>
            {
              isDataLoading &&
              <div className='flex-shrink-0 d-flex justify-content-center align-items-center mr-1 data-item-loading'>
                <Loading type={LoadingType.Donut} width={16} height={16} />
              </div>
            }
            <div className='flex-grow-1 text-truncate d-flex align-items-center' title={dataSourceUtils.getDsTypeString(d.dataSourceJson?.type, intl)}>
              {
                !isDataLoading &&
                <div className='flex-shrink-0 d-flex justify-content-center align-items-center data-thumbnail'>
                  <Icon icon={dataSourceUtils.getDsIcon(Immutable(d.dataSourceJson))} color='#FFFFFF' size='12' />
                </div>
              }
              {
                isDataError &&
                <Alert className='flex-shrink-0' css={css`padding-left: 0 !important; padding-right: 0 !important;`} buttonType='tertiary' form='tooltip' size='small' type='error' text={translate('dataSourceCreateError')} />
              }
              <div className={classNames('flex-grow-1 text-truncate data-label', { 'pl-2': !isDataError })} title={renamingDataOptions ? '' : label}>
                {
                  isRenaming
                    ? <TextInput className='w-100' size='sm' defaultValue={label} onAcceptValue={value => { onRenameData(d, value) }} ref={renamingInputRef} />
                    : label
                }
              </div>
            </div>
          </div>
          <div className='flex-shrink-0 d-flex justify-content-end align-items-center data-item-operations'>
            {
              !isDataLoading && !isDataError &&
              <Button className='jimu-outline-inside' type='tertiary' size='sm' icon onClick={() => { toggleRenameData(d) }} title={translate('rename')} aria-label={translate('rename')}>
                <EditOutlined size='m' />
              </Button>
            }
            {
              isDataActionEnabled &&
              <DataActionList widgetId={widgetId} dataSets={[{ dataSource: ds, records: [], name: ds.getDataSourceJson().label || ds.getDataSourceJson().sourceLabel }]} listStyle={DataActionListStyle.Dropdown} buttonSize='sm' buttonType='tertiary' hideGroupTitle />
            }
            <Button className='jimu-outline-inside' type='tertiary' size='sm' icon onClick={() => { onRemoveData(d.dataSourceJson.id) }} title={translate('remove')} aria-label={translate('remove')}>
              <TrashOutlined size='m' />
            </Button>
          </div>
        </div>
      })
    }
  </div>
}

const style = css`
  max-height: calc(100% - 35px);
  overflow: auto;

  .pt-12 {
    padding-top: 12px;
  }

  .data-item {
    width: 100%;
    overflow: hidden;
  }
  .data-item-loading {
    position: relative;
    width: 24px;
    height: 24px;
    border: 1px solid #0095DB;
  }
  .data-thumbnail {
    width:  26px;
    height:  26px;
    background-color: #0095DB;
  }
  .data-label {
    font-size: 13px;
    color: var(--dark-800);
  }
`

const useDataListStyle = (theme: IMThemeVariables) => {
  // add inside outline style to data action dropdown button to avoid cut off of focus ring
  return useMemo(() => css`
    ${style}
    .data-item-operations .data-action-dropdown .data-action-button{
      &:focus,
      &:focus-visible {
        outline-offset: -${theme.focusedStyles?.offset};
      }
      border: 0;
    }
  `, [theme.focusedStyles?.offset])
}
