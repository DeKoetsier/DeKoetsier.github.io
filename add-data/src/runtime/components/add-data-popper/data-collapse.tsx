/** @jsx jsx */
import { React, ReactRedux, jsx, css, type IMDataSourceJson, Immutable, i18n, dataSourceUtils, type IMState, DataSourceStatus, hooks } from 'jimu-core'
import { Button, defaultMessages as jimuUIMessages, Icon, Alert, Loading, LoadingType } from 'jimu-ui'

import { DownOutlined } from 'jimu-icons/outlined/directional/down'
import { UpOutlined } from 'jimu-icons/outlined/directional/up'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'

import { type DataOptions } from '../../types'
import { createDataSourcesByDataOptions, destroyDataSourcesById, getDataSource, usePrevious } from '../../utils'

export interface DataCollapseProps {
  multiDataOptions: DataOptions[]
  widgetId: string
  onFinish: (multiDataOptions: DataOptions[]) => void
  onRemove: (dsId: string) => void
  setErrorMsg: (msg: string) => void
}

const { useState, useEffect } = React
const { useSelector } = ReactRedux

export const DataCollapse = (props: DataCollapseProps) => {
  const { multiDataOptions, widgetId, onFinish: propsOnFinish, onRemove, setErrorMsg } = props
  const translate = hooks.useTranslation(jimuUIMessages)
  const [isCollapseOpen, setIsCollapseOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const prevMultiDataOptions = usePrevious(multiDataOptions)

  useEffect(() => {
    // Remove data based on diff.
    const removedMultiDataOptions = prevMultiDataOptions?.filter(prevD => !multiDataOptions.some(d => d.dataSourceJson.id === prevD.dataSourceJson.id)) || []
    destroyDataSourcesById(removedMultiDataOptions.map(d => d.dataSourceJson.id), widgetId, false)

    // Create data based on diff.
    setIsLoading(true)
    const addedMultiDataOptions = multiDataOptions.filter(d => !prevMultiDataOptions?.some(prevD => d.dataSourceJson.id === prevD.dataSourceJson.id))
    createDataSourcesByDataOptions(addedMultiDataOptions, widgetId, false).catch(err => {
      setErrorMsg(translate('dataSourceCreateError'))
    }).finally(() => {
      setIsLoading(false)
    })
  }, [widgetId, multiDataOptions, prevMultiDataOptions, setErrorMsg, translate])

  const toggleCollapse = () => {
    setIsCollapseOpen(!isCollapseOpen)
  }

  const onFinish = () => {
    propsOnFinish(multiDataOptions)
  }

  return <div className='data-collapse' css={style}>
    {
      multiDataOptions.length > 0 &&
      <div className='data-container surface-2 p-3'>
        <div className='d-flex justify-content-between align-items-center'>
          <div className='d-flex align-items-center n-selected' role="group" aria-label={translate('selected')}>
            <span className='mr-2'>{multiDataOptions.length}</span>
            <span className='text-truncate' title={translate('selected')}>{translate('selected')}</span>
            <Button type='tertiary' size='sm' icon onClick={toggleCollapse} title={isCollapseOpen ? translate('down') : translate('up')} aria-label={isCollapseOpen ? translate('down') : translate('up')}>
              {
                isCollapseOpen ? <DownOutlined size='s' /> : <UpOutlined size='s' />
              }
            </Button>
          </div>
          <div className='small-done-btn'>
            {
              !isCollapseOpen &&
              <Button onClick={onFinish} disabled={isLoading} type='primary' className='text-truncate w-100 px-2' title={translate('done')}>
                {translate('done')}
              </Button>
            }
          </div>
        </div>

        {
          isCollapseOpen &&
          <div className='data-items' role="list">
            {
              multiDataOptions.map((d, i) => <DataItem key={i} isLoading={isLoading} onRemove={onRemove} dsJson={Immutable(d.dataSourceJson)} />)
            }
          </div>
        }

        {
          isCollapseOpen &&
          <div className='big-done-btn w-100'>
            <Button onClick={onFinish} disabled={isLoading} type='primary' className='text-truncate w-100' title={translate('done')} aria-label={translate('done')}>
              {translate('done')}
            </Button>
          </div>
        }
      </div>
    }
  </div>
}

function DataItem ({ dsJson, isLoading, onRemove }: { dsJson: IMDataSourceJson, isLoading: boolean, onRemove: (dsId: string) => void }) {
  const translate = hooks.useTranslation(jimuUIMessages)
  const intl = i18n.getIntl()
  const ds = getDataSource(dsJson.id)
  const dsInfo = useSelector((state: IMState) => state.dataSourcesInfo?.[dsJson.id])
  const isDataError = dsInfo ? dsInfo.instanceStatus === DataSourceStatus.CreateError : !ds && !isLoading
  const isDataLoading = dsInfo ? dsInfo.instanceStatus === DataSourceStatus.NotCreated : !ds && isLoading

  return <div className='d-flex align-items-center justify-content-between w-100 data-item' role="listitem" aria-label={dsJson.label || dsJson.sourceLabel}>
    <div className='d-flex align-items-center flex-grow-1 text-truncate' title={dataSourceUtils.getDsTypeString(dsJson?.type, intl)}>
      {
        isDataError &&
        <div className='d-flex justify-content-center align-items-center flex-shrink-0 data-error'>
          <Alert className='flex-shrink-0' css={css`padding-left: 0 !important; padding-right: 0 !important;`} buttonType='tertiary' form='tooltip' size='small' type='error' text={translate('dataSourceCreateError')} />
        </div>
      }
      {
        isDataLoading &&
        <div className='d-flex justify-content-center align-items-center flex-shrink-0 data-loading'>
          <Loading type={LoadingType.Donut} width={16} height={16} />
        </div>
      }
      {
        !isDataError && !isDataLoading &&
        <div className='d-flex justify-content-center align-items-center flex-shrink-0 data-thumbnail'>
          <Icon icon={dataSourceUtils.getDsIcon(dsJson)} color='#FFFFFF' size='12' />
        </div>
      }
      <div className='flex-grow-1 text-truncate pl-2 data-label' title={dsJson.label || dsJson.sourceLabel}>
        {dsJson.label || dsJson.sourceLabel}
      </div>
    </div>
    <div className='d-flex align-items-center flex-shrink-0'>
      <Button type='tertiary' size='sm' icon onClick={() => { onRemove(dsJson.id) }} title={translate('remove')} aria-label={translate('remove')}>
        <CloseOutlined size={14} color='var(--dark-800)' />
      </Button>
    </div>
  </div>
}

const style = css`
  .data-container {
    background-color: var(--white);
    position: absolute;
    right: 0;
    left: 0;
    bottom: 0;
    box-shadow: 0px -1px 4px rgba(0, 0, 0, 0.16) !important;
    border: 0 !important;
    z-index: 10;
    .n-selected {
      font-size: 14px;
      max-width: 130px;
    }
    .data-items {
      max-height: 500px;
      overflow-y: auto;
      overflow-x: hidden;
      .data-thumbnail {
        width:  26px;
        height:  26px;
        background-color: #0095DB;
      }
      .data-loading, .data-error {
        position: relative;
        width: 24px;
        height: 24px;
        border: 1px solid #0095DB;
      }
      .data-label {
        font-size: 13px;
        color: var(--dark-800);
      }
      .data-item {
        height: 26px;
        margin-bottom: 12px;
      }
    }
    .small-done-btn {
      max-width: 90px;
    }
  }
`
