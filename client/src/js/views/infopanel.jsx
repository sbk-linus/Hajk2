var Panel = require('views/panel');
var FeatureInfo = require('components/featureinfo');

/**
 * @class
 */
var InfoPanelView = {
  /**
   * @property {Array<{external:"ol.feature"}>}
   * @instance
   */
  features: [],

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      featureinfo: [],
      activeIndex: 0
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.model.get("features").on("reset", this.handleReset);
    this.props.model.on("change:loadFishished", this.handleAdd);
    this.props.model.on("change:selectedFeature", this.handleChangeSelectedFeature);
    this.features = this.props.model.get("features").map(function (f) { return f.get("information"); });
    this.setState({
      featureinfo: this.features
    });
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off("change:selectedFeature", this.handleChangeSelectedFeature);
    this.props.model.off("change:loadFishished", this.handleAdd);
    this.props.model.get("features").off("reset", this.handleReset);
    this.props.model.clearHighlight();
  },

  /**
   * Reset the features of this panel.
   * @instance
   */
  handleReset: function() {
    this.features = [];
  },

  /**
   * Add feature to the info panel view, this will trigger set state.
   * @instance
   * @param {external:"ol.feature"}
   */
  handleAdd: function (feature, collection) {
    if (this.props.model.get('loadFishished') === true) {
      this.features = this.props.model.get("features").map(f => f.get("information"));
      this.setState({
        featureinfo: this.features
      });
    }
  },

  /**
   * Change selected feature.
   * @instance
   * @param {object} s
   * @param {external:"ol.feature"}
   */
  handleChangeSelectedFeature: function (s, feature) {
    this.setState({
      activeIndex: this.props.model.get("features").toArray().indexOf(feature)
    });
  },

  /**
   * Go to next feature.
   * @instance
   */
  decreaseIndex: function () {
    var newIndex = this.state.activeIndex > 0 ?
      this.state.activeIndex - 1 :
      this.state.activeIndex;
    var feature = this.props.model.get("features").at(newIndex);
    if (feature) {
      this.props.model.set("selectedFeature", feature);
    }
  },

  /**
   * Go to the previous feature.
   * @instance
   */
  increaseIndex: function () {
    var newIndex = this.state.activeIndex < this.state.featureinfo.length - 1 ?
      this.state.activeIndex + 1 :
      this.state.activeIndex;
    var feature = this.props.model.get("features").at(newIndex);
    if (feature) {
      this.props.model.set("selectedFeature", feature);
    }
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {

    var infos = this.state.featureinfo;
    var current = this.state.activeIndex;
    var that = this;
    var info;

    infos.sort((a, b) =>
      a.layerindex === b.layerindex ? 0 :
        a.layerindex > b.layerindex ? -1 : 1
    );

    info = infos[current];

    return (
      <Panel title="Information" onCloseClicked={this.props.onCloseClicked} minimized={this.props.minimized}>
        <div className="info-panel panel-content">
          {(function () {
            if (current !== -1) {
              return [
                <div key="0" className="navigation">
                  <span onClick={that.decreaseIndex} className="fa fa-arrow-circle-left left"></span>
                    {current + 1} av {infos.length}
                  <span onClick={that.increaseIndex} className="fa fa-arrow-circle-right right" ></span>
                </div>,
                <FeatureInfo key="1" info={info} />
              ];
            } else {
              return <div className="no-info">Klicka på objekt i kartan för att få mer information...</div>;
            }
          }())}
        </div>
      </Panel>
    );
  }
};

/**
 * InfoPanelView module.<br>
 * Use <code>require('views/infopanel')</code> for instantiation.
 * @module InfoPanelView-module
 * @returns {InfoPanelView}
 */
module.exports = React.createClass(InfoPanelView);