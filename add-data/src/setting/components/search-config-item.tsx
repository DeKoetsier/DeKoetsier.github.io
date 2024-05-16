/** @jsx jsx */
import { css, type IMThemeVariables, jsx, React, i18n, type IntlShape } from 'jimu-core'
import { Button, Checkbox, TextInput, Link } from 'jimu-ui'
import { SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { ItemCategory } from 'jimu-ui/basic/item-selector'
import { type ItemCategoryInfo } from '../../config'
import { HelpOutlined } from 'jimu-icons/outlined/suggested/help'
import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'
import { EditOutlined } from 'jimu-icons/outlined/editor/edit'
import { CheckOutlined } from 'jimu-icons/outlined/application/check'
import { type useTranslation } from 'jimu-core/lib/hooks'

const { useMemo, useState, useRef, useEffect } = React

interface LabelProps {
  enabled: boolean
  label?: string
  showIcons?: boolean
  canDelete?: boolean
  defaultLabel: string
  onEnabledChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
  onDelete: () => void
  onLabelChange: (newLabel: string) => void
  translate: ReturnType<typeof useTranslation>
}

interface Props {
  intl: IntlShape
  theme: IMThemeVariables
  itemCategoryInfo: ItemCategoryInfo
  curatedFilter?: string
  defaultLabel: string
  onEnabledChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
  onCustomLabelChange: (value: string) => void
  onCuratedFilterChange: (value: string) => void
  onDelete: () => void
  translate: ReturnType<typeof useTranslation>
}

const LabelOfItem = (props: LabelProps): JSX.Element => {
  const { enabled, label = '', showIcons, canDelete, defaultLabel, onEnabledChange, onDelete, onLabelChange, translate } = props

  const editInputRef = useRef<HTMLInputElement>()
  const [isEditing, setIsEditing] = useState(false)
  const startEdit = () => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current?.focus()
    }
  }, [isEditing])

  const handleLabelChange = (value: string) => {
    setIsEditing(false)
    onLabelChange(value)
  }

  const [editingLabel, setEditingLabel] = useState(label)
  useEffect(() => {
    setEditingLabel(label)
  }, [label])
  const handleEditingLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabel(e.target.value)
  }

  return (
    <div className='d-flex align-items-center pr-1' css={css`height: 2rem`}>
      <div className='d-flex align-items-center mb-0 flex-grow-1' css={css`padding-left: 0.125rem`}>
        <Checkbox className='mr-2' checked={enabled} onChange={onEnabledChange} />
        <div className='flex-grow-1' onDoubleClick={startEdit} css={!isEditing && css`max-width: ${canDelete ? '7.125rem' : '8.525rem'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`}>
          {
            isEditing
              ? <TextInput
                  css={css`height: 1.5rem; max-width: ${canDelete ? '7.125rem' : '8.525rem'}`}
                  size='sm'
                  ref={editInputRef}
                  value={editingLabel}
                  onAcceptValue={handleLabelChange}
                  onChange={handleEditingLabelChange}
                  placeholder={defaultLabel}
                />
              : <span title={label || defaultLabel}>{label || defaultLabel}</span>
          }
        </div>
      </div>
      {showIcons && !isEditing && <Button
        className='p-0 mx-1'
        size='sm'
        type='tertiary'
        icon
        onClick={startEdit}
        aria-label={translate('rename')}
      >
        <EditOutlined size='m'/>
      </Button>}
      {showIcons && isEditing && <Button
        className='p-0 mx-1'
        size='sm'
        type='tertiary'
        icon
        onClick={() => { setIsEditing(false) }}
        aria-label={translate('done')}
      >
        <CheckOutlined size='m'/>
      </Button>}
      {showIcons && canDelete && <Button
        className='p-0 mr-1'
        size='sm'
        type='tertiary'
        icon
        onClick={onDelete}
        aria-label={translate('deleteOption')}
      >
        <TrashOutlined size='m'/>
      </Button>}
    </div>
  )
}

export default function SearchConfigItem (props: Props) {
  const { intl, theme, itemCategoryInfo, defaultLabel, onEnabledChange, onCustomLabelChange, onCuratedFilterChange, onDelete, translate } = props
  const { type, enabled, customLabel } = itemCategoryInfo

  const isCurated = useMemo(() => type === ItemCategory.Curated, [type])

  const [showIcons, setShowIcons] = useState(false)

  const [editingCuratedFilter, setEditingCuratedFilter] = useState('')
  useEffect(() => {
    setEditingCuratedFilter(itemCategoryInfo.curatedFilter || '')
  }, [itemCategoryInfo.curatedFilter])
  const handleEditingCuratedLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingCuratedFilter(e.target.value)
  }

  return (
    <div className='flex-grow-1' css={css`flex-basis: 0;`} onMouseOver={() => { setShowIcons(true) }} onMouseOut={() => { setShowIcons(false) }}>
      <SettingSection
        title={
          <LabelOfItem
            enabled={enabled}
            label={customLabel}
            showIcons={showIcons}
            canDelete={isCurated}
            defaultLabel={defaultLabel}
            onEnabledChange={onEnabledChange}
            onDelete={onDelete}
            onLabelChange={onCustomLabelChange}
            translate={translate}
          />
        }
        className='p-0 m-0 flex-grow-1'
        role='group'
        css={css`flex-basis: 0`}
        aria-label={customLabel || defaultLabel}
      >
        {
          isCurated &&
          <SettingRow flow='wrap'
            className='mt-1'
            css={css`
              line-height: 1.5rem;
              .jimu-widget-setting--row-label {
                margin-bottom: 0.375rem;
              }
            `}
            label={
              <div className='d-flex align-items-center'>
                {translate('curatedFilter')}
                <Link
                  to='https://doc.arcgis.com/en/arcgis-online/reference/advanced-search.htm'
                  icon target='_blank' aria-label={translate('help')}
                  css={css`
                    padding: 0 !important;
                    .svg-component{
                      margin-right: 0;
                      color: ${theme.colors.palette.dark[400]};
                    }
                    :hover {
                      .svg-component{
                        color: ${theme.colors.black};
                      }
                    }
                  `}
                ><HelpOutlined autoFlip={!i18n.isSameLanguage(intl?.locale, 'he')} /></Link>
              </div>
            }>
            <TextInput
              className='flex-grow-1 mb-2 pr-2'
              data-draggable='true'
              size='sm'
              type='text'
              value={editingCuratedFilter}
              onPointerDown={(e) => { e.stopPropagation() }}
              onAcceptValue={onCuratedFilterChange}
              onChange={handleEditingCuratedLabelChange}
              title={itemCategoryInfo.curatedFilter}
            />
          </SettingRow>
        }
      </SettingSection>
    </div>
  )
}
