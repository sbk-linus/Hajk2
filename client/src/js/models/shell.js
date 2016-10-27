var MapModel = require('models/map');
var LayerCollection = require('collections/layers');
var ToolCollection = require('collections/tools');
var NavigationPanelModel = require("models/navigation");

/**
 * @description
 *
 *  Prototype for creating a shell model.
 *  The shell is used as a container for the application environment.
 *  This intermediate class holds references to other modules. (Map, Tools, Layers, Navigation)
 *  Any communication between models will be occur through this model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {object} options - Default options
 */
var ShellModel = {

  initialize: function (config) {
    this.initialConfig = config;
    this.cid += '_map';
    if (config) {
      config.map.target = this.cid;
      _.each(config.projections || [], function (proj) {
        proj4.defs(proj.code, proj.definition);
        ol.proj.addProjection(new ol.proj.Projection({
          code: proj.code,
          extent: proj.extent,
          units: proj.units
        }));
      });
      this.set('canStart', true);
    } else {
      this.set('canStart', false);
    }
  },

  configure: function () {
    var config = this.initialConfig;
    if (this.get('canStart')) {
      this.set('map', new MapModel(config.map));

      this.set('layerCollection', new LayerCollection(config.layers, { shell: this, mapConfig: config.map }));
      this.set('toolCollection', new ToolCollection(config.tools, { shell: this }));

      var panels = _.chain(this.get('toolCollection').toArray())
      .filter(function (tool) { return tool.get('panel'); })
      .map(function (panel) {
        return {
          type: panel.get('panel'),
          model: panel
        };
      }).value();
      this.set('navigation', new NavigationPanelModel({ panels: panels }));
    }
  },

  /**
   * Get map property value
   * @instance
   * @return {MapModel} map model
   */
  getMap: function () {
    return this.get('map');
  },

  /**
   * Get layer collection property value
   * @instance
   * @return {LayerCollection} layer collection
   */
  getLayerCollection: function () {
    return this.get('layerCollection');
  },

  /**
   * Get tool collection property value
   * @instance
   * @return {ToolCollection} tool collection
   */
  getToolCollection: function () {
    return this.get('toolCollection');
  },

  /**
   * Get navigation property value
   * @instance
   * @return {NavigationModel} navigation model
   */
  getNavigation: function () {
    return this.get('navigation');
  },

  /**
   * Convert model to JSON-string
   * @instance
   * @return {string} JSON-string
   */
  toJSON: function () {
    var json = _.clone(this.initialConfig);
    json.layers = this.getLayerCollection().toJSON();
    json.map = this.getMap().toJSON();
    json.toolCollection = this.getToolCollection().toJSON();
    return JSON.stringify(json);
  },

  /**
   * Set bookmark property value
   * @instance
   * @param {Array<{object}>} bookmars
   */
  setBookmarks: function (bookmarks) {
    this.set('bookmarks', bookmarks);
  },

  /**
   * Get bookmarks property value
   * @instance
   * @return {object} bookmars
   */
  getBookmarks: function () {
    return this.get('bookmarks');
  },

  /**
   * Get configuration property value
   * @instance
   * @return {object} configuration
   */
  getConfig: function () {
    return this.get('config');
  },

  /**
   * Set configuration property value
   * @instance
   * @param {object} configuration
   */
  setConfig: function (config) {
    this.set('config', config);
    this.set('configUpdated', new Date().getTime());
  }
};

/**
 * Shell model module.<br>
 * Use <code>require('models/shell')</code> for instantiation.
 * @module ShellModel-module
 * @returns {ShellModel}
 */
module.exports = Backbone.Model.extend(ShellModel);