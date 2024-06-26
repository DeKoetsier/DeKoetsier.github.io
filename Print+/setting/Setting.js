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

define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    "dojo/_base/lang",
    'dojo/on',
    'dojo/Deferred',
    "dojo/dom-style",
    "dojo/dom-attr",
    "esri/request",
    'jimu/dijit/Message',
    'jimu/portalUtils',
    'jimu/portalUrlUtils',
    'jimu/utils',
    "dojo/store/Memory",
    'dijit/form/ValidationTextBox',
    'dijit/form/ComboBox',
    'jimu/dijit/CheckBox',
    'dijit/form/SimpleTextarea'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    lang,
    on,
    Deferred,
    domStyle,
    domAttr,
    esriRequest,
    Message,
    portalUtils,
    portalUrlUtils,
    utils,
    Memory) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-print-setting',
      memoryFormat: new Memory(),
      memoryLayout: new Memory(),
      _portalPrintTaskURL: null,
      validUrl: true,

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
        domAttr.set(this.checkImg, 'src', require.toUrl('jimu') + "/images/loading.gif");
        this.serviceURL.validator = lang.hitch(this, this.validator);
        this.own(on(this.serviceURL, 'Change', lang.hitch(this, this.onUrlChange)));
      },

      validator: function(value) {
        if (!this.validUrl) {
          this.serviceURL.invalidMessage = this.nls.urlNotAvailable;
          return false;
        }

        var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

        if (value === portalNewPrintUrl || /^https?:\/\/.+sharing\/tools\/newPrint$/.test(value) ||
          /^https?:\/\/.+\/GPServer\//.test(value)) {
          return true;
        }
        this.serviceURL.invalidMessage = this.nls.notPrintTask;
        return false;
      },

      onUrlChange: function() {
        this.validUrl = true;

        if (!this.serviceURL.validate()) {
          return;
        }

        var taskUrl = this.serviceURL.get('value');
        if (taskUrl) {
          domStyle.set(this.checkProcessDiv, "display", "");
          this.memoryFormat.data = {};
          this.memoryLayout.data = {};
          this.defaultFormat.set('store', this.memoryFormat);
          this.defaultLayout.set('store', this.memoryLayout);
          this.defaultFormat.set('value', "");
          this.defaultLayout.set('value', "");
          domStyle.set(this.defaultFormat.domNode.parentNode.parentNode, 'display', 'none');
          domStyle.set(this.defaultLayout.domNode.parentNode.parentNode, 'display', 'none');
          // domStyle.set(this.showAdvancedOptionChk.domNode.parentNode.parentNode, 'display', 'none');

          var serviceUrl = portalUrlUtils.setHttpProtocol(this.serviceURL.get('value'));
          var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

          if (serviceUrl === portalNewPrintUrl ||
            /sharing\/tools\/newPrint$/.test(serviceUrl)) {
            domStyle.set(this.checkProcessDiv, "display", "none");
          } else {
            this._getPrintTaskInfo(taskUrl);
          }
        }
      },

      _getPrintTaskInfo: function(taskUrl) {
        // portal own print url: portalname/arcgis/sharing/tools/newPrint
        esriRequest({
          url: taskUrl,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback",
          timeout: 60000,
          load: lang.hitch(this, this._handlePrintInfo),
          error: lang.hitch(this, this._handleError)
        });
      },

      _handleError: function() {
        domStyle.set(this.checkProcessDiv, "display", "none");
        this.validUrl = false;
        this.serviceURL.validate();
      },

      _handlePrintInfo: function(data) {
        domStyle.set(this.checkProcessDiv, "display", "none");
        domStyle.set(this.defaultFormat.domNode.parentNode.parentNode, 'display', '');
        domStyle.set(this.defaultLayout.domNode.parentNode.parentNode, 'display', '');
        // domStyle.set(this.showAdvancedOptionChk.domNode.parentNode.parentNode, 'display', '');
        var hasWebmapParam = false, hasOutputParam = false;

        if (data && data.parameters) {
          var len = data.parameters.length;
          var webmapParam = 'web_map_as_json', outputParam = 'output_file';
          for (var i = 0; i < len; i++) {
            var param = data.parameters[i];
            if (param.name === "Format" || param.name === "Layout_Template") {
              var values = data.parameters[i].choiceList;
              var defaultValue = data.parameters[i].defaultValue;
              var json = [];
              if (values) {
                var n = values.length;
                for (var m = 0; m < n; m++) {
                  json.push({
                    name: values[m],
                    id: values[m]
                  });
                }
              } else {
                json.push({
                  name: defaultValue,
                  id: defaultValue
                });
              }

              if (param.name === "Format") {
                this.memoryFormat.data = json;
                this.defaultFormat.set('store', this.memoryFormat);
                if (this.config.serviceURL === this.serviceURL.get('value') &&
                  this.config.defaultFormat) {
                  this.defaultFormat.set('value', this.config.defaultFormat);
                } else {
                  this.defaultFormat.set('value', defaultValue);
                }
              } else {
                this.memoryLayout.data = json;
                this.defaultLayout.set('store', this.memoryLayout);
                if (this.config.serviceURL === this.serviceURL.get('value') &&
                  this.config.defaultLayout) {
                  this.defaultLayout.set('value', this.config.defaultLayout);
                } else {
                  this.defaultLayout.set('value', defaultValue);
                }
              }
            }
            if (typeof param.name === 'string' && param.name.toLowerCase() === webmapParam) {
              hasWebmapParam = true;
            }
            if (typeof param.name === 'string' && param.name.toLowerCase() === outputParam) {
              hasOutputParam = true;
            }
          }
        }

        if (!hasWebmapParam || !hasOutputParam) {
          this.validUrl = false;
          this.serviceURL.validate();
        }
      },

      setConfig: function(config) {
        this.config = config;
        this.loadPrintURL(config);

        if (config.defaultTitle) {
          this.defaultTitle.set('value', utils.stripHTML(config.defaultTitle));
        } else {
          this.defaultTitle.set('value', "ArcGIS WebMap");
        }

        if (config.defaultAuthor) {
          this.defaultAuthor.set('value', utils.stripHTML(config.defaultAuthor));
        } else {
          this.defaultTitle.set('value', "ArcGIS Web AppBuilder");
        }

        if (config.defaultCopyright) {
          this.defaultCopyright.set('value', utils.stripHTML(config.defaultCopyright));
        }
        this.copyrightEditableChk.setValue(config.copyrightEditable !== false);
        // this.showAdvancedOptionChk.setValue(config.showAdvancedOption !== false);
      },

      _onTitleBlur: function() {
        this.defaultTitle.set('value', utils.stripHTML(this.defaultTitle.get('value')));
      },

      _onAuthorBlur: function() {
        this.defaultAuthor.set('value', utils.stripHTML(this.defaultAuthor.get('value')));
      },

      _onCopyrightBlur: function() {
        this.defaultCopyright.set('value', utils.stripHTML(this.defaultCopyright.get('value')));
      },

      getConfig: function() {
        if (!this.serviceURL.validate()) {
          var popup = new Message({
            message: this.nls.warning,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
          return false;
        }
        this.config.serviceURL = this.serviceURL.get('value');
        this.config.defaultTitle = utils.stripHTML(this.defaultTitle.get('value'));
        this.config.defaultAuthor = utils.stripHTML(this.defaultAuthor.get('value'));
        this.config.defaultCopyright = utils.stripHTML(this.defaultCopyright.get('value'));
        this.config.defaultFormat = this.defaultFormat.get('value');
        this.config.defaultLayout = this.defaultLayout.get('value');
        this.config.copyrightEditable = this.copyrightEditableChk.getValue();
        // this.config.showAdvancedOption = this.showAdvancedOptionChk.getValue();
        return this.config;
      },

      loadPrintURL: function() {
        this._getPrintTaskURL(this.appConfig.portalUrl)
          .then(lang.hitch(this, function(printServiceUrl) {
            this.serviceURL.set('value', printServiceUrl);
          }));
      },

      _getPrintTaskURL: function(portalUrl) {
        var printDef = new Deferred();
        if (this.config && this.config.serviceURL) {
          printDef.resolve(this.config.serviceURL);
          return printDef;
        }
        var def = portalUtils.getPortalSelfInfo(portalUrl);
        def.then(lang.hitch(this, function(response) {
          var printServiceUrl = response && response.helperServices &&
            response.helperServices.printTask && response.helperServices.printTask.url;
          if (printServiceUrl) {
            printDef.resolve(printServiceUrl);
          } else {
            printDef.reject('error');
          }
        }), lang.hitch(this, function(err) {
          new Message({
            message: this.nls.portalConnectionError || // there need a nls string!!!
            (err && err.message) || 'portal connection error'
          });
          printDef.reject('error');
          console.error(err);
        }));

        return printDef;
      }
    });
  });
