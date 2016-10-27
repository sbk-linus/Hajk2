
var X2JS = require('x2js');

var search = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  getConfig: function (url) {
    $.ajax(url, {
      success: data => {
        data.wfslayers.sort((a, b) => {
          var d1 = parseInt(a.date)
          ,   d2 = parseInt(b.date);
          return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
        });
        this.set('layers', data.wfslayers);
      }
    });
  },

  addLayer: function (layer, callback) {
    $.ajax({
      url: this.get('config').url_layer_settings,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  updateLayer: function(layer, callback) {
    $.ajax({
      url: this.get('config').url_layer_settings,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  removeLayer: function (layer, callback) {
    $.ajax({
      url: this.get('config').url_layer_settings + "/" + layer.id,
      method: 'DELETE',
      contentType: 'application/json',
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  prepareProxyUrl: function (url) {
    return this.get('config').url_proxy ?
      this.get('config').url_proxy + "/" + url.replace(/http[s]?:\/\//, '') :
      url;
  },

  getLayerDescription: function(url, layer, callback) {
    url = this.prepareProxyUrl(url);
    $.ajax(url, {
      data: {
        request: 'describeFeatureType',
        typename: layer
      },
      success: data => {
        var parser = new X2JS()
        ,   xmlstr = data.xml ? data.xml : (new XMLSerializer()).serializeToString(data)
        ,   apa = parser.xml2js(xmlstr);
        try {
          var props = apa.schema.complexType.complexContent.extension.sequence.element.map(a => {
            return {
              name: a._name,
              localType: a._type ? a._type.replace(a.__prefix + ':', '') : ''
            }
          });
          if (props)
            callback(props);
          else
            callback(false);
        } catch (e) {
          callback(false);
        }
      }
    });
  },

  parseWFSCapabilitesTypes: function (data) {
    var types = [];
    $(data).find('FeatureType').each((i, featureType) => {
      types.push({
        name: $(featureType).find('Name').first().get(0).textContent,
        title: $(featureType).find('Title').first().get(0).textContent
      });
    });
    return types;
  },

  getWMSCapabilities: function (url, callback) {
    $.ajax(this.prepareProxyUrl(url), {
      data: {
        service: 'WFS',
        request: 'GetCapabilities'
      },
      success: data => {
        var response = this.parseWFSCapabilitesTypes(data);
        callback(response);
      },
      error: data => {
        callback(false);
      }
    });
  }

});

module.exports = new search();