/**
 * @class
 */
var LayerItemView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      caption: "",
      visible: false,
      expanded: false,
      name: "",
      legend: [],
      status: "ok"
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.layer.on("change:status", this.onStatusChanged, this);
    this.props.layer.on("change:visible", this.onVisibleChanged, this);
    this.props.layer.on("change:legend", this.onLegendChanged, this);
    this.props.layer.on('change:showLegend', this.onShowLegendChanged, this);
    this.setState({
      status: this.props.layer.get('status'),
      caption: this.props.layer.getCaption(),
      visible: this.props.layer.getVisible(),
      showLegend: this.props.layer.get('showLegend'),
      legend: this.props.layer.getLegend(),
    });
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.layer.off("change:visible", this.onVisibleChanged, this);
    this.props.layer.off("change:legend", this.onLegendChanged, this);
    this.props.layer.off('change:showLegend', this.onShowLegendChanged, this);
    this.props.layer.off("change:status", this.onStatusChanged, this);
  },

  /**
   * On status change event handler.
   * @instance
   */
  onStatusChanged: function () {
    this.setState({
      status: this.props.layer.get('status')
    });
  },

  /**
   * On visible change event handler.
   * @instance
   */
  onVisibleChanged: function () {
    if (this.props.layer) {
      this.props.layer.getLayer().setVisible(this.props.layer.getVisible());
    }
    this.setState({
      visible: this.props.layer.getVisible()
    });
  },

  /**
   * On legend change event handler.
   * @instance
   */
  onLegendChanged: function () {
    this.setState({ legend: this.props.layer.getLegend() });
  },

  /**
   * On show legend change event handler.
   * @instance
   */
  onShowLegendChanged: function () {
    this.setState({ showLegend: this.props.layer.get('showLegend') });
  },

  /**
   * Toggle visibility of this layer item.
   * @instance
   */
  toggleVisible: function (e) {
    e.stopPropagation();
    this.props.layer.setVisible(!this.state.visible);
  },

  /**
   * Toggle legend visibility
   * @instance
   */
  toggleLegend: function (e) {
    e.stopPropagation();
    this.props.layer.set('showLegend', !this.state.showLegend);
  },

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatus: function () {
    return this.state.status === "loaderror" ?
    (
      <span href="#" className="tooltip" title="Lagret kunde inte laddas in. Kartservern svarar inte.">
        <span title="" className="fa fa-exclamation-triangle tile-load-warning"></span>
      </span>
    ) : null;
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var caption       = this.state.caption
    ,   expanded      = this.state.showLegend
    ,   visible       = this.state.visible
    ,   toggleLegend  = (e) => { this.toggleLegend(e) }
    ,   toggleVisible = (e) => { this.toggleVisible(e) };

    if (!caption) {
      return null;
    }

    var components = this.props.layer.getExtendedComponents({
      legendExpanded: expanded
    });

    var innerBodyClass = expanded && components.legend.legendPanel ? "panel-body" : "hidden";

    var statusClass = this.state.status === "loaderror" ? "fa fa-exclamation-triangle tile-load-warning tooltip" : "";

    return (
      <div className="panel panel-default layer-item">
        <div className="panel-heading" onClick={toggleLegend}>
          <span onClick={toggleVisible} className="clickable">
            <i className={visible ? 'fa fa-check-square': 'fa fa-square'}></i>&nbsp;
            {this.renderStatus()}
            <span className="layer-item-header-text">{caption}</span>&nbsp;
          </span>
          {components.legend.legendButton}
        </div>
        <div className={innerBodyClass}>
          {components.legend.legendPanel}
        </div>
      </div>
    );
  }
};

/**
 * LayerItemView module.<br>
 * Use <code>require('views/layeritem')</code> for instantiation.
 * @module LayerItemView-module
 * @returns {LayerItemView}
 */
module.exports = React.createClass(LayerItemView);