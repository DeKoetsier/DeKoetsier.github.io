///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/dijit/Report', 'jimu/dijit/PageUtils'],
function(declare, BaseWidget, Report, PageUtils) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-QuickPrint',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);

	      this.report = new Report({
           reportLogo:"https://DeKoetsier.github.io/WBlogo.PNG",
            footNotes: "",
            printTaskUrl:"https://gis.witteveenbos.com/server/rest/services/WB_tools/WB_ExportWebMap/GPServer/Export%20Web%20Map",//http://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
            reportLayout: {
              "pageSize": PageUtils.PageSizes.A4,
              "orientation": PageUtils.Orientation.Portrait
            }

          });
		  
      console.log('startup');
    },

    _onBtnPrintClicked: function(){

      var printData = [
      {
        //title: "Kaart",
        addPageBreak: true,
        type: "map",
        map: this.map,

      }];
      this.report.print("Rapport", printData);
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    showVertexCount: function(count){
      this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    }
  });
});