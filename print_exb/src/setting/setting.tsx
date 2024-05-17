/** @jsx jsx */
import { React, jsx, css, polished, LayoutType, ReactRedux, type IMState, hooks } from 'jimu-core'
import { type JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import { type AllWidgetSettingProps, getAppConfigAction } from 'jimu-for-builder'
import { Icon, Button, Alert, CollapsablePanel, defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { type IMConfig, ModeType, type IMPrintTemplateProperties } from '../config'
import defaultMessage from './translations/default'
import { isDefined } from '../utils/utils'
import TemplateSetting from './component/template-setting'
import CommonTemplateSetting from './component/template-common-setting'
import PreviewStyle from './component/print-preview-style'
import UtilityPlaceholder from './component/utility-placeholder'
const { useEffect, useRef } = React

const CLASSIC_DEFAULT_SIZE = {
  width: '360px',
  height: '460px'
}

const COMPACT_DEFAULT_SIZE = {
  width: '40px',
  height: '40px'
}

interface ExtraProps {
  id: string
}

type SettingProps = AllWidgetSettingProps<IMConfig> & ExtraProps

const Setting = (props: SettingProps) => {
  const { config, id, portalUrl, onSettingChange, useMapWidgetIds } = props
  const nls = hooks.useTranslation(defaultMessage, jimuiDefaultMessage)

  const serviceErrorMessageTimeoutRef = useRef(null)

  const layoutInfo = ReactRedux.useSelector((state: IMState) => state?.appStateInBuilder?.widgetsState[id]?.layoutInfo)
  const appConfig = ReactRedux.useSelector((state: IMState) => state.appStateInBuilder.appConfig)

  const [jimuMapView, setJimuMapView] = React.useState(null as JimuMapView)
  const [openRemind, setOpenRemind] = React.useState(false)
  const [isOpenCollapsablePanel, setIsOpenCollapsablePanel] = React.useState(false)
  const [showLoading, setShowLoading] = React.useState(false)

  const SYLE = css`
    & .custom-setting-collapse>div.collapse-header {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    .no-utility-setting {
      border-bottom: none;
    }
    .select-mode-con {
      &>div {
        flex: 1;
      }
      button {
        height: ${polished.rem(80)};
        background: var(--light-200);
        border: 2px solid transparent;
        &:not(:disabled):not(.disabled).active {
          border-color: var(--primary);
          background: var(--light-200);
        }
      }
      img {
        width: 100%;
        height: 100%;
        margin: 0 auto;
      }
    }
    .remind-con {
      top: ${polished.rem(90)};
    }
    .text-wrap {
      overflow: hidden;
      white-space: pre-wrap;
    }
    .setting-collapse {
      & {
        margin-bottom: ${polished.rem(8)};
      }
      .collapse-header {
        line-height: 2.2;
        padding-left: ${polished.rem(8)} !important;
        padding-right: ${polished.rem(8)} !important;
      }
      .handle{
        height: ${polished.rem(32)};
        background: var(--light-500);
        padding-left: ${polished.rem(8)};
        padding-right: ${polished.rem(8)};
      }
    }
  `

  useEffect(() => {
    initDefaultBorder()
  }, [config])

  const initDefaultBorder = () => {
    const style = appConfig?.widgets?.[id]?.style
    if (!config?.hasInitBorder && !style?.border) {
      const appConfigAction = getAppConfigAction()
      const defaultBorder = {
        color: 'var(--light-400)',
        type: 'solid',
        width: '1px'
      }
      let newStyle
      if (style) {
        newStyle = style.set('border', defaultBorder)
      } else {
        newStyle = {
          border: defaultBorder
        }
      }
      const newConfig = config?.set('hasInitBorder', true)
      appConfigAction
        .editWidgetProperty(id, 'style', newStyle)
        .editWidgetProperty(id, 'config', newConfig)
        .exec()
    }
  }

  const handlePropertyChange = (key: string, value: any) => {
    if (config?.[key] === value) return false
    const newConfig = config.setIn([key], value)
    onSettingChange({
      id: id,
      config: newConfig
    })
  }

  const handleMapWidgetChange = (useMapWidgetIds: string[]): void => {
    onSettingChange({
      id: id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  const toggleRemindPopper = (open: boolean = false) => {
    setOpenRemind(open)
    if (open) {
      clearTimeout(serviceErrorMessageTimeoutRef.current)
      serviceErrorMessageTimeoutRef.current = setTimeout(() => {
        setOpenRemind(false)
      }, 5000)
    }
  }

  const handleActiveViewChange = (newJimuMapView: JimuMapView): void => {
    if (!isDefined(newJimuMapView) || newJimuMapView.view.type === '3d') {
      setJimuMapView(null)
    } else if (newJimuMapView?.id !== jimuMapView?.id) {
      setJimuMapView(newJimuMapView)
    }
  }

  const handleModeTypeChange = (modeType: ModeType) => {
    const newConfig = config.setIn(['modeType'], modeType)
    //Edit default size of print layout when change mode type
    const appConfigAction = getAppConfigAction()
    let printSize = CLASSIC_DEFAULT_SIZE
    if (modeType === ModeType.Compact) {
      printSize = COMPACT_DEFAULT_SIZE
    }
    const layoutType = getLayoutType()
    if (layoutType === LayoutType.FixedLayout) {
      const { layoutId, layoutItemId } = layoutInfo
      const layout = appConfig.layouts[layoutId]
      const layoutItem = layout?.content?.[layoutItemId]
      const bbox = layoutItem.bbox.set('width', printSize.width).set('height', printSize.height)
      appConfigAction
        .editLayoutItemProperty(layoutInfo, 'bbox', bbox)
        .editWidgetProperty(id, 'config', newConfig)
        .exec()
    } else {
      appConfigAction
        .editWidgetProperty(id, 'config', newConfig)
        .exec()
    }
  }

  const handleTemplatePropertyChange = (templateProperty: IMPrintTemplateProperties) => {
    const newConfig = config.set('commonSetting', templateProperty)
    onSettingChange({
      id: id,
      config: newConfig
    })
  }

  //Get layout type
  const getLayoutType = (): LayoutType => {
    const layoutId = layoutInfo?.layoutId
    const layoutType = appConfig?.layouts?.[layoutId]?.type
    return layoutType
  }

  const toggleOpenCollapsablePanel = () => {
    setIsOpenCollapsablePanel(!isOpenCollapsablePanel)
  }

  const toggleLoading = (isShowLoading: boolean) => {
    setShowLoading(isShowLoading)
  }

  const renderModeSetting = () => {
    return (
      <SettingSection className='map-selector-section'>
        <SettingRow flow='wrap' label={nls('printMode')} role='group' aria-label={nls('printMode')}>
          <div className='d-flex w-100 select-mode-con'>
            <div className='flex-grow-1 text-truncate'>
              <Button className='w-100' title={nls('printClassic')} active={config?.modeType === ModeType.Classic} onClick={() => { handleModeTypeChange(ModeType.Classic) }}>
                <Icon autoFlip icon={require('./assets/Classic.svg')}/>
              </Button>
              <div className='mt-1 w-100 text-center text-truncate' title={nls('printClassic')}>{nls('printClassic')}</div>
            </div>

            <div className='flex-grow-1 ml-2 text-truncate'>
              <Button className='w-100' active={config?.modeType === ModeType.Compact} title={nls('printCompact')} onClick={() => { handleModeTypeChange(ModeType.Compact) }}>
                <Icon autoFlip icon={require('./assets/Compact.svg')}/>
              </Button>
              <div className='mt-1 text-center text-truncate' title={nls('printCompact')}>{nls('printCompact')}</div>
            </div>
          </div>
        </SettingRow>
      </SettingSection>
    )
  }

  return (
    <div className='widget-setting-search jimu-widget-search' css={SYLE}>
      {/* Print source select */}
      <SettingSection className='map-selector-section' role='group' aria-label={nls('printSource')} title={nls('printSource')}>
        <SettingRow flow='wrap' label={nls('selectMap')} role='group' aria-label={nls('selectMap')}>
          <MapWidgetSelector onSelect={handleMapWidgetChange} aria-label={nls('selectMap')} useMapWidgetIds={useMapWidgetIds} />
        </SettingRow>
        <div className='fly-map'>
          <div><JimuMapViewComponent useMapWidgetId={useMapWidgetIds?.[0]} onActiveViewChange={handleActiveViewChange} /></div>
        </div>
      </SettingSection>

      {/* Print mode setting */}
      {renderModeSetting()}

      <div className='w-100 position-absolute remind-con'>
        <Alert
          withIcon
          form='basic'
          type='warning'
          open={openRemind}
          closable={true}
          className='w-100'
          text={nls('serviceIsNotAvailable')}
          onClose={() => { toggleRemindPopper(false) }}
        />
      </div>

      {/* Print template list */}
      <TemplateSetting
        id={id}
        config={config}
        portalUrl={portalUrl}
        handlePropertyChange={handlePropertyChange}
        onSettingChange={onSettingChange}
        jimuMapView={jimuMapView}
        toggleRemindPopper={toggleRemindPopper}
        showLoading={showLoading}
        toggleLoading={toggleLoading}
        className={(!config?.useUtility && !showLoading) && 'no-utility-setting'}
      />

      {/* Print template common setting */}
      {config?.useUtility && <SettingSection role='group' aria-label={nls('templateCommonSettings')}>
        <CollapsablePanel
          label={nls('templateCommonSettings')}
          isOpen={isOpenCollapsablePanel}
          onRequestOpen={toggleOpenCollapsablePanel}
          onRequestClose={toggleOpenCollapsablePanel}
          aria-label={nls('templateCommonSettings')}
          className='custom-setting-collapse'
        >
          <CommonTemplateSetting
            id={id}
            printTemplateProperties={config?.commonSetting}
            handleTemplatePropertyChange={handleTemplatePropertyChange}
            modeType={config?.modeType}
            jimuMapView={jimuMapView}
          />
        </CollapsablePanel>
      </SettingSection>}

      {/* Print preview style setting */}
      {config?.useUtility && <PreviewStyle
        config={config}
        handlePropertyChange={handlePropertyChange}
      />}

      {(!config?.useUtility && !showLoading) && <UtilityPlaceholder/>}
    </div>
  )
}

export default Setting
