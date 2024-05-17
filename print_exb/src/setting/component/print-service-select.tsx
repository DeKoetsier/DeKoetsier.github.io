/** @jsx jsx */
import { React, jsx, css, Immutable, type IMUseUtility, type UseUtility, type ImmutableArray, SupportedUtilityType, hooks } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessages } from 'jimu-ui'
import { type SettingChangeFunction } from 'jimu-for-builder'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { UtilitySelector } from 'jimu-ui/advanced/utility-selector'
import defaultMessages from '../translations/default'
import { type IMConfig } from '../../config'
import { getNewTemplateInfo } from '../../utils/service-util'
const { useState, useEffect, useRef } = React
interface Props {
  config: IMConfig
  id: string
  showLoading: boolean
  onSettingChange: SettingChangeFunction
  toggleLoading: (isShowLoading: boolean) => void
  toggleRemindPopper: (open?: boolean) => void
}

const PrintServiceSelect = (props: Props) => {
  const isRemoveServiceRef = useRef(false)
  const nls = hooks.useTranslation(defaultMessages, jimuiDefaultMessages)
  const { config, id, onSettingChange, toggleLoading, toggleRemindPopper } = props

  const [useUtility, setUseUtility] = useState(config?.useUtility)

  const STYLE = css`
    &>div>div {
      padding-left: 0!important;
      padding-right: 0!important;
    }
    .utility-list {
      margin-bottom: 0 !important;
    }
  }`

  useEffect(() => {
    setUseUtility(config?.useUtility)
  }, [config])

  const handleUtilityChange = (utilities: ImmutableArray<UseUtility>) => {
    const utility = utilities[0]
    setUseUtility(utility)
    if (!utility) {
      isRemoveServiceRef.current = true
      removeUtility()
    } else {
      isRemoveServiceRef.current = false
      addUseUtility(utility)
    }
  }

  const removeUtility = () => {
    let newConfig = config
    newConfig = newConfig.set('useUtility', null)
    setUseUtility(null)
    toggleLoading(false)
    onSettingChange({
      id: id,
      config: newConfig,
      useUtilities: []
    })
  }

  const addUseUtility = async (utility: IMUseUtility) => {
    toggleLoading(true)
    getNewTemplateInfo(utility, config).then(newConfig => {
      if (isRemoveServiceRef.current) {
        return false
      }
      toggleLoading(false)
      onSettingChange({
        id: id,
        config: newConfig,
        useUtilities: utility ? [utility] : []
      })
    }, err => {
      removeUtility()
      toggleLoading(false)
      toggleRemindPopper(true)
    })
  }

  return (
    <div css={STYLE}>
      <SettingRow flow='wrap' label={nls('printService')} role='group' aria-label={nls('printService')}>
        <UtilitySelector
          useUtilities={Immutable(useUtility ? [useUtility] : [])}
          onChange={handleUtilityChange}
          showRemove
          closePopupOnSelect
          type={SupportedUtilityType.Printing}
        />
      </SettingRow>
    </div>
  )
}

export default PrintServiceSelect
