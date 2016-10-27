var Panel = require('views/panel');
var LayerItem = require('views/layeritem');
var BackgroundSwitcher = require('components/backgroundswitcher');

/**
 * @class
 */
var LayerPanelView = {
  /**
   * Mounted layers
   * @property {object}
   * @instance
   */
  mountedLayers: {},

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.model.on('change:layerCollection', this.onLayerCollectionChanged, this);
    this.props.model.get('layerCollection').forEach(layer => {
      layer.on('change:visible', () => {
        this.updateGroupToggledCheckbox(layer);
      });
    });
    this.setState({
      layers: this.props.model.get("layerCollection")
    });
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off("change:layerCollection", this.onLayerCollectionChanged, this);
    this.props.model.get('layerCollection').forEach(layer => {
      layer.off('change:visible');
    });
  },

  /**
   * On layer collection change event handler.
   * @instance
   */
  onLayerCollectionChanged: function () {
    this.setState({ layers: this.props.model.get("layerCollection") });
  },

  /**
   * Find group in config tree.
   * @instance
   * @param {object[]} groups
   * @param {number} groupId
   * @return {object} group
   */
  findGroupInConfig: function recursive(groups, id) {
    var found = false;
    groups.forEach(group => {
      if (group.id === id) {
        found = group;
      } else {
        if (group.hasOwnProperty('groups')) {
          if (!found) {
            found = recursive(group.groups, id);
          }
        }
      }
    });
    return found;
  },

  /**
   * Find layers in given group.
   * @instance
   * @param {group} group
   * @return {Layer[]} layers
   */
  getLayersForGroup: function(group) {

    var layersInModel = this.props.model.get("layerCollection")
    ,   layers = [];

    if (!layersInModel || !group) {
      return [];
    }

    group.layers.forEach(inLayer => {
      var layer = layersInModel.find(layer => layer.id === inLayer.id);
      if (layer) {
        layer.set('group', group.id);
        layers.push(layer);
      }
    });

    return layers;
  },

  /**
   * Get a flattened list of ALL layers per group.
   * @instance
   * @param {object} group
   * @return {Layer[]} layers
   */
  drillGroupForLayers: function recursive(group) {

    var groups = group.groups
    ,   layers = this.getLayersForGroup(group);

    if (groups) {
      groups.forEach((subgroup) => {
        layers = layers.concat(recursive.call(this, subgroup));
      })
    }

    return layers;
  },

  /**
   * Toggle the whole group
   * @deprecated
   * @instance
   * @param {object} group
   * @param {object} e
   */
  toggleGroup: function (group, e) {

    var layers = this.drillGroupForLayers(group)
    ,   checked = e.target.checked;

    layers.forEach((layer) => {
      var groupId = layer.get('group');
      layer.set('visible', checked);
    });
  },

  /**
   * Update the group checkbox, checked if all the layers are visible.
   * @deprecated
   * @instance
   * @param {object} group
   * @param {object} e
   */
  updateGroupToggledCheckbox: function recur(layer) {
    setTimeout(() => {


      if (layer) {
        var groupId = typeof layer === 'string' ? layer : (layer.get ? layer.get('group') : undefined)
        ,   group
        ,   layers;

        if (groupId) {
          group  = this.findGroupInConfig(this.groups, groupId);
          layers = this.drillGroupForLayers(group);

          if (group.parent && group.parent != -1) {
            recur.call(this, group.parent);
          }
          //this.refs["group_" + groupId].checked = layers.every(lyr => lyr.getVisible() === true);
        }
      }
    }, 0);
  },

  /**
   * Toggle the visibility of all layers in given group.
   * @deprecated
   * @instance
   * @param {object} group
   * @param {object} e
   */
  toggleGroupVisibility: function (group, e) {

    var state = {}
    ,   value
    ,   id = "group_" + group.id;

    value = state[id] = this.state[id] === "hidden" ? "visible" : "hidden";

    this.props.model.set(id, value);
    this.setState(state);
  },

  /**
   * Render layers in group.
   * @instance
   * @param {object} group
   * @return {LayerItemView[]}
   */
  renderLayers: function (group) {

    var layers = this.getLayersForGroup(group);

    if (layers.length === 0) {
      return null;
    }

    return layers.map((layer, index) => {
      return (<LayerItem key={"layer_" + Math.random()} layer={layer} />);
    });
  },

  /**
   * Render groups.
   * @instance
   * @param {object[]} groups
   * @return {external.ReactElement} groups
   */
  renderGroups: function recursive(groups) {

    return groups.map((group, i) => {

      var layers = this.renderLayers(group)
      ,   subgroups
      ,   id = "group_" + group.id
      ,   buttonClassName;

      if (layers) {
        layers.forEach(layer => {
          var id = layer.props.layer.get('id');
          if (!this.mountedLayers.hasOwnProperty(id)) {
            this.mountedLayers[id] = layer.props.layer;
          }
        });
      }

      if (!this.state.hasOwnProperty(id)) {
        this.state[id] = this.props.model.get(id);
      }

      if (group.hasOwnProperty("groups")) {
        subgroups = recursive.call(this, group.groups);
      }

      buttonClassName = this.state[id] === "hidden" ?
        "fa fa-plus-square-o clickable" :
        "fa fa-minus-square-o clickable";

      return (
        <div className="layer-group" key={i}>
          <div>
            <span className={buttonClassName} onClick={this.toggleGroupVisibility.bind(this, group)}></span>&nbsp;
            {/*<input type="checkbox" ref={id} onChange={this.toggleGroup.bind(this, group)} id={id} />*/}
            <label htmlFor={id}>{group.name}</label>
          </div>
          <div className={this.state[id]}>
            {layers}
            {subgroups}
          </div>
        </div>
      )
    })
  },

  /**
   * Change layer-list configuration.
   * @deprecated
   * @instance
   * @param {object} e
   */
  selectTheme: function (e) {

    var value  = e.target.value
    ,   before = this.mountedLayers;

    this.mountedLayers = {};
    this.props.model.set("selectedTheme", parseInt(value));
    this.setState({
      selectedTheme: value
    });

    // Set visible layers to false,
    // if they are missing on the new collection.
    // The set timeout is to force React to
    // set the new state before this is done.
    setTimeout(() => {

      var p = this.mountedLayers
      ,   a = Object.keys(before)
      ,   b = Object.keys(p)
      ,   m = a.filter(e => b.indexOf(e) < 0)
      ,   l = this.state.layers;

      l.toArray().filter(layer =>
        m.find(v =>
          parseInt(v) === layer.get('id')
        )
      ).forEach(layer => {
        layer.setVisible(false);
      });

    }, 0)
  },

  /**
   * Render themes select options.
   * @deprecated
   * @instance
   * @param {object[]} themes
   * @return {external.ReactElement} theme options
   */
  renderThemeOptions: function (themes) {
    return themes.map((theme, i) => (
      <option key={i} value={theme.id}>{theme.name}</option>
    ));
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {

    this.groups = this.props.model.get('groups');

    groups = this.renderGroups(this.props.model.get('groups'));

    this.props.model.get('layerCollection').forEach(layer => {
      this.updateGroupToggledCheckbox(layer);
    });

    return (
      <Panel title="Teckenförklaring" onCloseClicked={this.props.onCloseClicked} minimized={this.props.minimized}>
        <div className="layer-panel">
          <BackgroundSwitcher layers={this.props.model.getBaseLayers()} model={this.props.model}></BackgroundSwitcher>
          {groups}
        </div>
      </Panel>
    );
  }
};

/**
 * LayerPanelView module.<br>
 * Use <code>require('views/layerpanel')</code> for instantiation.
 * @module LayerPanelView-module
 * @returns {LayerPanelView}
 */
module.exports = React.createClass(LayerPanelView);