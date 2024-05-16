/** @jsx jsx */
import { React, jsx, css, defaultMessages as jimuCoreMessages, hooks, type ImmutableArray } from 'jimu-core'
import { defaultMessages as jimuUIMessages, Button, Popper, Tab, Tabs, PanelHeader, Alert, MobilePanel } from 'jimu-ui'

import { PlusOutlined } from 'jimu-icons/outlined/editor/plus'

import defaultMessages from '../../translations/default'
import { type DataOptions } from '../../types'
import { DataItemSearch } from './data-item-search'
import { DataUrlInput } from './data-url-input'
import { DataFileUpload } from './data-file-upload'
import { DataCollapse } from './data-collapse'
import { useEffect } from 'react'
import { type ItemCategoryInfo } from '../../../config'

export interface AddDataPopperProps {
  portalUrl: string
  widgetId: string
  buttonSize: 'sm' | 'lg'
  hiddenTabs: SupportedTabs[]
  popperReference: React.RefObject<HTMLDivElement>
  nextOrder: number
  itemCategoriesInfo?: ImmutableArray<ItemCategoryInfo>
  hidePopper?: boolean
  onFinish: (multiDataOptions: DataOptions[]) => void
}

const { useState, useMemo, useRef } = React

const SUPPORTED_TABS = ['search', 'url', 'file'] as const

export type SupportedTabs = typeof SUPPORTED_TABS[number]

export const AddDataPopper = (props: AddDataPopperProps) => {
  const { portalUrl, widgetId, buttonSize, hiddenTabs, popperReference, nextOrder: propsNextOrder, onFinish: propsOnFinish, itemCategoriesInfo, hidePopper } = props
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>(null)
  const [multiDataOptionsFromSearch, setMultiDataOptionsFromSearch] = useState<DataOptions[]>([])
  const [multiDataOptionsFromUrl, setMultiDataOptionsFromUrl] = useState<DataOptions[]>([])
  const [multiDataOptionsFromFile, setMultiDataOptionsFromFile] = useState<DataOptions[]>([])
  const multiDataOptions = useMemo(() => multiDataOptionsFromSearch.concat(multiDataOptionsFromUrl).concat(multiDataOptionsFromFile).sort((d1, d2) => d1.order - d2.order), [multiDataOptionsFromSearch, multiDataOptionsFromUrl, multiDataOptionsFromFile])
  const nextOrder = useMemo(() => multiDataOptions.length > 0 ? Math.max(...multiDataOptions.map(d => d.order)) + 1 : propsNextOrder, [multiDataOptions, propsNextOrder])
  const tabs: SupportedTabs[] = useMemo(() => SUPPORTED_TABS.filter(t => !hiddenTabs?.some(hiddenT => t === hiddenT)), [hiddenTabs])
  const translate = hooks.useTranslation(jimuUIMessages, jimuCoreMessages, defaultMessages)
  const hideErrorMsgTimer = useRef<NodeJS.Timeout>(null)
  const mobile = hooks.useCheckSmallBrowserSizeMode()

  const addDataButtonRef = useRef<HTMLButtonElement>()

  useEffect(() => {
    if (errorMsg && !hideErrorMsgTimer.current) {
      hideErrorMsgTimer.current = setTimeout(() => {
        setErrorMsg(null)
        hideErrorMsgTimer.current = null
      }, 5000)
    }
  }, [errorMsg])

  const onRemove = (dsId: string) => {
    if (multiDataOptionsFromSearch.some(d => d.dataSourceJson.id === dsId)) {
      setMultiDataOptionsFromSearch(multiDataOptionsFromSearch.filter(d => d.dataSourceJson.id !== dsId))
    }
    if (multiDataOptionsFromUrl.some(d => d.dataSourceJson.id === dsId)) {
      setMultiDataOptionsFromUrl(multiDataOptionsFromUrl.filter(d => d.dataSourceJson.id !== dsId))
    }
    if (multiDataOptionsFromFile.some(d => d.dataSourceJson.id === dsId)) {
      setMultiDataOptionsFromFile(multiDataOptionsFromFile.filter(d => d.dataSourceJson.id !== dsId))
    }
  }

  const onFinish = (multiDataOptions: DataOptions[]) => {
    propsOnFinish(multiDataOptions)
    togglePopper()
  }

  const togglePopper = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    // When closing popper, need to reset the added data.
    if (!newIsOpen) {
      setMultiDataOptionsFromSearch([])
      setMultiDataOptionsFromUrl([])
      setMultiDataOptionsFromFile([])

      if (addDataButtonRef.current) {
        addDataButtonRef.current.focus()
      }
    }
  }

  useEffect(() => {
    if (!mobile && hidePopper && isOpen) {
      togglePopper()
    }
  }, [hidePopper])

  const getPopperContent = () => {
    return <PopperContent mobile={mobile} errorMsg={errorMsg} translate={translate} tabs={tabs} togglePopper={togglePopper} onFinish={onFinish} onRemove={onRemove} portalUrl={portalUrl} widgetId={widgetId} nextOrder={nextOrder} multiDataOptions={multiDataOptions} multiDataOptionsFromSearch={multiDataOptionsFromSearch} multiDataOptionsFromUrl={multiDataOptionsFromUrl} multiDataOptionsFromFile={multiDataOptionsFromFile} setErrorMsg={setErrorMsg} setMultiDataOptionsFromSearch={setMultiDataOptionsFromSearch} setMultiDataOptionsFromUrl={setMultiDataOptionsFromUrl} setMultiDataOptionsFromFile={setMultiDataOptionsFromFile} itemCategoriesInfo={itemCategoriesInfo} />
  }

  return <div className='add-data-popper' css={style}>
    {
      buttonSize === 'lg' &&
      <Button type='primary' className='flex-grow-1 text-center' onClick={togglePopper} aria-label={translate('clickToAddData')} ref={addDataButtonRef} title={translate('clickToAddData')}>
        <div className='w-100 px-2 d-flex align-items-center justify-content-center'>
          <PlusOutlined size='m' />
          <div className='text-truncate'>
            {translate('clickToAddData')}
          </div>
        </div>
      </Button>
    }
    {
      buttonSize === 'sm' &&
      <Button type='primary' className='d-flex justify-content-center align-items-center small-add-btn' onClick={togglePopper} aria-label={translate('clickToAddData')} ref={addDataButtonRef} title={translate('clickToAddData')}>
        <PlusOutlined size='m' className='m-0' />
      </Button>
    }
    {
      mobile
        ? <MobilePanel open={isOpen} onClose={togglePopper} title={translate('addData')}>
        {getPopperContent()}
      </MobilePanel>
        : <Popper open={isOpen} toggle={togglePopper} reference={popperReference} placement='right-start' aria-label={translate('addData')}>
          {getPopperContent()}
        </Popper>
    }
  </div>
}

const TabContent = ({ tab, portalUrl, widgetId, nextOrder, multiDataOptionsFromSearch, multiDataOptionsFromUrl, multiDataOptionsFromFile, setMultiDataOptionsFromSearch, setMultiDataOptionsFromUrl, setMultiDataOptionsFromFile, setErrorMsg, itemCategoriesInfo }: { tab: SupportedTabs, portalUrl: string, widgetId: string, nextOrder: number, multiDataOptionsFromSearch: DataOptions[], multiDataOptionsFromUrl: DataOptions[], multiDataOptionsFromFile: DataOptions[], setMultiDataOptionsFromSearch: (multiDataOptions: DataOptions[]) => void, setMultiDataOptionsFromUrl: (multiDataOptions: DataOptions[]) => void, setMultiDataOptionsFromFile: (multiDataOptions: DataOptions[]) => void, setErrorMsg: (msg: string) => void, itemCategoriesInfo?: ImmutableArray<ItemCategoryInfo> }) => {
  if (tab === 'search') {
    return <DataItemSearch portalUrl={portalUrl} widgetId={widgetId} onChange={setMultiDataOptionsFromSearch} nextOrder={nextOrder} multiDataOptions={multiDataOptionsFromSearch} itemCategoriesInfo={itemCategoriesInfo} />
  } else if (tab === 'url') {
    return <DataUrlInput widgetId={widgetId} onChange={setMultiDataOptionsFromUrl} nextOrder={nextOrder} multiDataOptions={multiDataOptionsFromUrl} setErrorMsg={setErrorMsg} />
  } else if (tab === 'file') {
    return <DataFileUpload portalUrl={portalUrl} widgetId={widgetId} nextOrder={nextOrder} onChange={setMultiDataOptionsFromFile} multiDataOptions={multiDataOptionsFromFile} setErrorMsg={setErrorMsg} />
  }
}

const PopperContent = ({ mobile, errorMsg, translate, tabs, togglePopper, onFinish, onRemove, portalUrl, widgetId, nextOrder, multiDataOptions, multiDataOptionsFromSearch, multiDataOptionsFromUrl, multiDataOptionsFromFile, setMultiDataOptionsFromSearch, setMultiDataOptionsFromUrl, setMultiDataOptionsFromFile, setErrorMsg, itemCategoriesInfo }: { mobile: boolean, errorMsg: string, translate: (id: string, values?: any) => string, tabs: SupportedTabs[], togglePopper: () => void, onFinish: (multiDataOptions: DataOptions[]) => void, onRemove: (dsId: string) => void, portalUrl: string, widgetId: string, nextOrder: number, multiDataOptions: DataOptions[], multiDataOptionsFromSearch: DataOptions[], multiDataOptionsFromUrl: DataOptions[], multiDataOptionsFromFile: DataOptions[], setMultiDataOptionsFromSearch: (multiDataOptions: DataOptions[]) => void, setMultiDataOptionsFromUrl: (multiDataOptions: DataOptions[]) => void, setMultiDataOptionsFromFile: (multiDataOptions: DataOptions[]) => void, setErrorMsg: (msg: string) => void, itemCategoriesInfo?: ImmutableArray<ItemCategoryInfo> }) => {
  return <div css={css`
    width: ${mobile ? '100%' : '240px'};
    height: ${mobile ? '100%' : '600px'};
    .add-data-popper-content {
      position: relative;
      height: ${multiDataOptions.length ? (mobile ? 'calc(100% - 64px)' : 'calc(100% - 120px)') : (mobile ? '100%' : 'calc(100% - 56px)')};
    }
    .tab-content {
      overflow: hidden;
    }
    .jimu-nav {
      border-bottom: 1px solid var(--light-400);
    }
    .multiple-lines-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-word;
      word-wrap: break-word;
    }
    .item-selector-search {
      .text-input-prefix {
        svg {
          margin-left: 0 !important;
          color: var(--light-800) !important;
        }
      }
    }
  `}>
    { !mobile && <PanelHeader title={translate('addData')} showClose={true} onClose={togglePopper} level={1} className='p-3' /> }
    <div className='add-data-popper-content'>
      {
        tabs.length > 1 && <Tabs type='underline' className='w-100 h-100' fill defaultValue={tabs[0]}>
          {
            tabs.map((t, i) => <Tab key={i} id={t} title={translate(t)}>
              <TabContent tab={t} portalUrl={portalUrl} widgetId={widgetId} nextOrder={nextOrder} setErrorMsg={setErrorMsg} multiDataOptionsFromSearch={multiDataOptionsFromSearch} multiDataOptionsFromUrl={multiDataOptionsFromUrl} multiDataOptionsFromFile={multiDataOptionsFromFile} setMultiDataOptionsFromSearch={setMultiDataOptionsFromSearch} setMultiDataOptionsFromUrl={setMultiDataOptionsFromUrl} setMultiDataOptionsFromFile={setMultiDataOptionsFromFile} itemCategoriesInfo={itemCategoriesInfo} />
            </Tab>)
          }
        </Tabs>
      }
      {
        tabs.length === 1 && <div className='w-100 h-100'>
          <TabContent tab={tabs[0]} portalUrl={portalUrl} widgetId={widgetId} nextOrder={nextOrder} setErrorMsg={setErrorMsg} multiDataOptionsFromSearch={multiDataOptionsFromSearch} multiDataOptionsFromUrl={multiDataOptionsFromUrl} multiDataOptionsFromFile={multiDataOptionsFromFile} setMultiDataOptionsFromSearch={setMultiDataOptionsFromSearch} setMultiDataOptionsFromUrl={setMultiDataOptionsFromUrl} setMultiDataOptionsFromFile={setMultiDataOptionsFromFile} itemCategoriesInfo={itemCategoriesInfo} />
        </div>
      }
      {
        errorMsg && <Alert className='w-100' css={css`position: absolute; top: ${tabs.length === 1 ? 0 : '33px'}; left: 0; right: 0; z-index: 1;`} closable form='basic' onClose={() => { setErrorMsg(null) }} open text={errorMsg} type='warning' withIcon />
      }
    </div>
    <DataCollapse multiDataOptions={multiDataOptions} widgetId={widgetId} onFinish={onFinish} onRemove={onRemove} setErrorMsg={setErrorMsg} />
  </div>
}

const style = css`
  .small-add-btn {
    border-radius: 16px;
    width: 32px;
    height: 32px;
    padding: 0;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  }
`
