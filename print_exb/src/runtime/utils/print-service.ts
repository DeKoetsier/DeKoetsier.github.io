import { type UseUtility } from 'jimu-core'
import { loadArcGISJSAPIModules } from 'jimu-arcgis'
import { type MapView, type PrintTemplateProperties } from '../../config'
import { getUrlOfUseUtility } from '../../utils/utils'
interface PrintOption {
  useUtility?: UseUtility
  mapView: MapView
  printTemplateProperties: PrintTemplateProperties
}

export const print = async (option: PrintOption) => {
  const { mapView, printTemplateProperties, useUtility } = option
  return getUrlOfUseUtility(useUtility).then(printServiceUrl => {
    return loadArcGISJSAPIModules(['esri/rest/support/PrintParameters', 'esri/rest/support/PrintTemplate', 'esri/rest/print', 'esri/geometry/SpatialReference']).then(modules => {
      const [PrintParameters, PrintTemplate, print, SpatialReference] = modules
      const template = new PrintTemplate(printTemplateProperties)
      const newMapView = initHasZOfGrpahicInMap(mapView)
      const printParameter = {
        view: newMapView,
        template: template
      } as any
      if (printTemplateProperties.wkid !== mapView?.spatialReference?.wkid) {
        printParameter.outSpatialReference = new SpatialReference({ wkid: printTemplateProperties.wkid })
      }
      const params = new PrintParameters(printParameter)

      return print.execute(printServiceUrl, params).then((printResult) => {
        return Promise.resolve(printResult)
      }).catch((printError) => {
        return Promise.reject(printError)
      })
    })
  })
}

/**
 * Set the 'hasZ' of the layer and graphic generated by the Draw widget to 'false'
*/
function initHasZOfGrpahicInMap (mapView) {
  mapView.layerViews.items = mapView?.layerViews?.items?.map(views => {
    if (views?.layer?.id?.includes('jimu-draw-layer-') || views?.layer?.id?.includes('bookmark-layer-')) {
      views.graphicsView.graphics.items = views?.graphicsView?.graphics?.items?.map(graphic => {
        if (graphic?.attributes?.jimuDrawId) {
          graphic.geometry.hasZ = false
          return graphic
        } else {
          return graphic
        }
      })
      return views
    } else {
      return views
    }
  })
  return mapView
}

export async function getPrintTemplateInfo (useUtility?: UseUtility) {
  return getUrlOfUseUtility(useUtility).then(printServiceUrl => {

  })
}
