/** @jsx jsx */
import { React, jsx, css, uuidv1, DataSourceTypes, loadArcGISJSAPIModule, getAppStore, defaultMessages as jimuCoreMessages, hooks, polished } from 'jimu-core'
import { Loading, LoadingType, Input, Label, Icon, Button } from 'jimu-ui'

import { PlusOutlined } from 'jimu-icons/outlined/editor/plus'

import defaultMessages from '../../translations/default'
import { type DataOptions, type FeatureCollection, type LayerInFeatureCollection } from '../../types'
import { getNextAddedDataId, preventDefault } from '../../utils'
import { useTheme } from 'jimu-theme'

export interface DataFileUploadProps {
  widgetId: string
  portalUrl: string
  multiDataOptions: DataOptions[]
  nextOrder: number
  onChange: (multiDataOptions: DataOptions[]) => void
  setErrorMsg: (msg: string) => void
}

interface FileInfo {
  id: string
  name: string
  type: SupportedFileTypes
  data: FormData
  size: number //bytes
}

enum SupportedFileTypes {
  CSV = 'csv',
  GeoJson = 'geojson',
  Shapefile = 'shapefile',
  KML = 'kml'
}

const MaxFileSize: { [key in SupportedFileTypes]: number /** bytes */ } = {
  [SupportedFileTypes.CSV]: 10485760,
  [SupportedFileTypes.GeoJson]: 10485760,
  [SupportedFileTypes.Shapefile]: 2097152,
  // KML size limitaion: https://doc.arcgis.com/en/arcgis-online/reference/kml.htm
  [SupportedFileTypes.KML]: 10485760
}

// value is translate key
enum UploadFileError {
  NotSupportedType = 'notSupportedFileTypeError',
  FailedToUpload = 'failedToUploadError',
  ExceedMaxSize = 'exceedMaxSizeError',
  ExceedMaxRecords = 'exceedMaxRecordsError'
}

const { useState, useEffect, useMemo, useRef } = React

const INPUT_ACCEPT = Object.values(SupportedFileTypes).map(t => getFileExtension(t)).join(',')

export const DataFileUpload = (props: DataFileUploadProps) => {
  const { onChange, setErrorMsg, nextOrder, portalUrl, widgetId, multiDataOptions } = props
  const translate = hooks.useTranslation(jimuCoreMessages, defaultMessages)
  const dragToUploadBtnId = useMemo(() => `${widgetId}-drag-to-upload`, [widgetId])
  const clickToUploadBtnId = useMemo(() => `${widgetId}-click-to-upload`, [widgetId])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const uploadingFileInfo = useRef<FileInfo>(null)
  const toRemoveFilesInfo = useRef<FileInfo[]>([])

  useEffect(() => {
    onChange(multiDataOptions)
  }, [multiDataOptions, onChange])

  const uploadRef = useRef()

  const onFileChange = async (e) => {
    if (!e.target.files) {
      return
    }

    try {
      setIsLoading(true)

      const file: File = e.target.files[0]
      const fileInfo = getFileInfo(file)
      uploadingFileInfo.current = fileInfo

      if (!fileInfo.type) {
        throw new Error(UploadFileError.NotSupportedType)
      }

      if (fileInfo.size > MaxFileSize[fileInfo.type]) {
        throw new Error(UploadFileError.ExceedMaxSize)
      }

      const featureCollection = await generateFeatureCollection(fileInfo, portalUrl)

      // Break the process if uploading of the file is canceled.
      if (toRemoveFilesInfo.current.some(f => f.id === fileInfo.id)) {
        toRemoveFilesInfo.current = toRemoveFilesInfo.current.filter(f => f.id !== fileInfo.id)
        return
      }

      if (featureCollection?.layers?.length > 0) {
        onChange(multiDataOptions.concat(featureCollection.layers.map((l: LayerInFeatureCollection, i) => ({
          dataSourceJson: {
            id: getNextAddedDataId(widgetId, nextOrder + i),
            type: DataSourceTypes.FeatureLayer,
            sourceLabel: l.layerDefinition?.name || (i === 0 ? fileInfo.name : `${fileInfo.name} ${i}`)
          },
          order: nextOrder + i,
          restLayer: l
        }))))
      }
    } catch (err) {
      // Show warning.
      if (err.message === UploadFileError.NotSupportedType) {
        setErrorMsg(translate(UploadFileError.NotSupportedType, { fileName: uploadingFileInfo.current?.name }))
      } else if (err.message === UploadFileError.ExceedMaxSize || err.details?.messages?.[0]?.includes('max size')) { // File exceeds the max size allowed of 10MB.
        setErrorMsg(translate(UploadFileError.ExceedMaxSize))
      } else if (err.message === UploadFileError.ExceedMaxRecords || err.message?.includes('maximum number')) { // The maximum number of records allowed (1000) has been exceeded.
        setErrorMsg(translate(UploadFileError.ExceedMaxRecords))
      } else {
        setErrorMsg(translate(UploadFileError.FailedToUpload, { fileName: uploadingFileInfo.current?.name }))
      }
    } finally {
      setIsLoading(false)
      uploadingFileInfo.current = null
      // Clear value to allow to upload the same file again.
      e.target.value = null

      if (uploadRef.current) {
        (uploadRef.current as HTMLInputElement).focus()
      }
    }
  }

  const onFileRemove = () => {
    toRemoveFilesInfo.current.push(uploadingFileInfo.current)
    uploadingFileInfo.current = null
    setIsLoading(false)
  }

  const [uploadInputFocused, setUploadInputFocused] = useState(false)
  const theme = useTheme()

  return <div className='data-file-upload w-100 h-100 pb-3 pt-5 px-3' css={style}>
    <div className='supported-type-icons d-flex justify-content-around align-items-center px-5 mb-3'>
      <Icon width={13} height={16} icon={require('../../assets/file.svg')} />
      <Icon width={24} height={24} icon={require('../../assets/file1.svg')} />
      <Icon width={32} height={32} icon={require('../../assets/file2.svg')} />
      <Icon width={24} height={24} icon={require('../../assets/file3.svg')} />
      <Icon width={13} height={16} icon={require('../../assets/file.svg')} />
    </div>

    <div className='supported-types'>{translate('supportedTypesHint')}</div>

    <div className='mt-3 drag-area-container'>
      <Label for={dragToUploadBtnId} className='drag-area text-center'>
        <div className='font-14'>{translate('dropOrBrowseToUpload')}</div>
        <div className='upload-btn-container w-75' title={translate('upload')}>
          <Label for={clickToUploadBtnId} className='upload-btn text-center mt-3 mb-0 text-truncate' css={uploadInputFocused ? css`outline: ${polished.rem(2)} solid ${theme.colors.palette.primary[700]}` : ''}>
            <PlusOutlined size={15} className='mr-2' />
            <span>{translate('upload')}</span>
          </Label>
          <Input id={clickToUploadBtnId} title='' className='upload-btn-file-input' type='file' accept={INPUT_ACCEPT} onChange={onFileChange} tabIndex={isLoading ? -1 : 0} ref={uploadRef}
          onFocus={() => { setUploadInputFocused(true) }} onBlur={() => { setUploadInputFocused(false) }} />
        </div>
      </Label>
      <Input id={dragToUploadBtnId} onClick={preventDefault} title='' className='drag-area-file-input' type='file' accept={INPUT_ACCEPT} onChange={onFileChange} tabIndex={-1} />
    </div>

    {
      isLoading &&
      <div className='upload-loading-container' title={translate('fileIsUploading', { fileName: uploadingFileInfo.current?.name })}>
        <div className='upload-loading-content'>
          <Loading className='upload-loading' type={LoadingType.Primary} width={30} height={28} />
          <div className='upload-loading-file-name d-flex justify-content-center align-items-center'>
            <div className='w-100 font-14 text-center'>{
              translate('fileIsUploading', { fileName: <div className='w-100 multiple-lines-truncate font-16'>{uploadingFileInfo.current?.name}</div> })}
            </div>
          </div>
          <div className='upload-loading-btn d-flex justify-content-center'>
            <Button type='danger' onClick={onFileRemove}>{translate('cancel')}</Button>
          </div>
        </div>
      </div>
    }
  </div>
}

function getFileInfo (file: File): FileInfo {
  const type = getFileType(file.name)
  const name = file.name.replace(`.${type}`, '')
  const data = new FormData()
  data.set('file', file)
  data.set('filetype', type)
  data.set('f', 'json')
  return {
    id: uuidv1(),
    type,
    name,
    data,
    size: file.size
  }
}

function readFileAsText (fileInfo: FileInfo) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = (event: any) => {
      resolve(event.target.result)
    }
    reader.readAsText(fileInfo.data.get('file') as File)
  })
}

function getKmlServiceUrl () {
  const isPortal = getAppStore().getState()?.portalSelf?.isPortal
  if (isPortal) {
    const portalUrl = getAppStore().getState()?.portalUrl
    return `${portalUrl}sharing/kml`
  }
  const env = window.jimuConfig.hostEnv
  const envHost = env === 'dev' ? 'devext' : env === 'qa' ? 'qa' : ''
  return `https://utility${envHost}.arcgis.com/sharing/kml`
}

async function generateFeatureCollection (fileInfo: FileInfo, portalUrl: string): Promise<FeatureCollection> {
  const esriRequest: typeof __esri.request = await loadArcGISJSAPIModule('esri/request')

  if (fileInfo.type === SupportedFileTypes.KML) {
    const serviceUrl = getKmlServiceUrl()
    const kmlString = await readFileAsText(fileInfo)
    const res = await esriRequest(serviceUrl, {
      query: {
        kmlString: encodeURIComponent(kmlString),
        model: 'simple',
        folders: ''
        // outSR: JSON.stringify(outSpatialReference)
      },
      responseType: 'json'
    })
    return res?.data?.featureCollection as FeatureCollection
  }

  // 1. Use REST API analyze to get `publishParameters` which is needed in REST API generate.
  const analyzeUrl = `${portalUrl}/sharing/rest/content/features/analyze`
  fileInfo.data.set('analyzeParameters', JSON.stringify({
    enableGlobalGeocoding: true,
    sourceLocale: getAppStore().getState().appContext?.locale ?? 'en' // TODO: use org geocode service
  }))
  const analyzeResponse = await esriRequest(analyzeUrl, {
    body: fileInfo.data,
    method: 'post'
  })
  fileInfo.data.delete('analyzeParameters')
  const publishParameters = analyzeResponse?.data?.publishParameters

  // 2. Use REST API generate to get features from the uploaded file.
  const generateUrl = `${portalUrl}/sharing/rest/content/features/generate`
  fileInfo.data.set('publishParameters', JSON.stringify({
    ...publishParameters,
    name: fileInfo.name
  }))
  const generateResponse = await esriRequest(generateUrl, {
    body: fileInfo.data,
    method: 'post'
  })
  fileInfo.data.delete('publishParameters')

  if (generateResponse?.data?.featureCollection) {
    (generateResponse?.data?.featureCollection as FeatureCollection)?.layers?.forEach((ly) => {
      ly.featureSet?.features?.forEach((feature) => {
        ly.layerDefinition?.fields?.forEach((field) => {
          const attrValue = feature.attributes?.[field.name]
          if (field.type === 'esriFieldTypeSmallInteger') {
            if (typeof attrValue === 'boolean') {
              feature.attributes[field.name] = attrValue ? 1 : 0
              return
            }
            if (typeof attrValue !== 'number') {
              feature.attributes[field.name] = null
            }
          }
        })
      })
    })
  }

  return generateResponse?.data?.featureCollection as FeatureCollection
}

function getFileType (name: string): SupportedFileTypes {
  return Object.values(SupportedFileTypes).find(t => name?.endsWith(getFileExtension(t)))
}

function getFileExtension (supportedFileType: SupportedFileTypes): string {
  return supportedFileType === 'shapefile' ? '.zip' : `.${supportedFileType}`
}

const style = css`
  position: relative;
  color: var(--dark-500);

  .font-14 {
    font-size: 14px;
  }

  .font-16 {
    font-size: 16px;
    font-weight: 500;
  }

  .upload-loading-container {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background-color: var(--white);
    z-index: 2;
  }
  .upload-loading-content {
    position: absolute;
    top: 0;
    bottom: 60px;
    right: 0;
    left: 0;
  }
  .upload-loading-file-name {
    position: absolute;
    width: 200px;
    height: 100px;
    right: calc(50% - 100px);
    top: 80px;
    word-break: break-all;
    overflow: hidden;
  }
  .upload-loading-btn {
    position: absolute;
    width: 200px;
    height: 32px;
    right: calc(50% - 100px);
    top: calc(50% + 80px);
    button.btn-danger {
      background-color: var(--danger-500);
      border: 0;
    }
  }

  .supported-types {
    font-size: 13px;
  }

  .drag-area-container {
    width: 100%;
    height: 280px;
  }
  .drag-area {
    border: 1px dashed var(--light-400);
    padding-top: 50%;
    width: 100%;
    height: 100%;
    user-select: none;
  }
  .upload-btn {
    border: 1px solid var(--light-400);
    color: var(--dark-800);
    background-color: var(--white);
    border-radius: 2px;
    line-height: 28px;
    padding-left: 16px;
    padding-right: 16px;
    height: 30px;
    user-select: none;
    max-width: 100%;
  }
  .upload-btn-container:hover {
    .upload-btn {
      background-color: var(--light-200) !important;
    }
  }
  .drag-area-container, .upload-btn-container {
    position: relative;
    display: inline-block;
    z-index: 1;
  }
  .upload-btn-file-input, .drag-area-file-input {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    opacity: 0;
  }
  .upload-btn-file-input {
    cursor: pointer;
  }

`
