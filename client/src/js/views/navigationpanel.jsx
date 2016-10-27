var panels = {
  'infopanel': require('views/infopanel'),
  'layerpanel': require('views/layerpanel'),
  'bookmarkpanel': require('views/bookmarkpanel'),
  'searchpanel': require('views/searchpanel'),
  'coordinatespanel': require('views/coordinatespanel'),
  'exportpanel': require('views/exportpanel'),
  'drawpanel': require('views/drawpanel'),
  'editpanel': require('views/editpanel'),
  'anchorpanel': require('views/anchorpanel')
};

var Alert = require('alert');

/**
 * @class
 */
var NavigationPanelView = {
  /**
   * Get default properties.
   * @instance
   * @return {object}
   */
  getDefaultProps : function () {
    return {
      items: [],
      alertVisible: false
    };
  },

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      toggled: false,
      minimized: false,
      activePanel: undefined
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.model.on("change:activePanel", (sender, panel) => {
       this.setState({
        'activePanel' : panel,
        'minimized': false
      });
    });

    this.props.model.on('change:alert', (e, value) => {
      this.setState({
        alertVisible: value
      });
    });

    this.props.model.on("change:visible", (sender, visible) => {
      this.setState({
        'toggled': visible
      });
    });

    this.props.model.on("change:toggled", (sender, visible) => {
      this.setState({ 'minimized': true});
    });

    this.props.model.on('change:r', () => {
      this.maximize();
    });
  },

  /**
   * Toggle the panel to/from minimized mode.
   * @instance
   */
  toggle: function () {
    if (this.state.activePanel) {
      this.props.model.set("toggled", !this.props.model.get("toggled"));
    }
  },

  /**
   * Maximize the panel.
   * @instance
   */
  maximize: function () {
    if (this.state.minimized) {
      this.setState({
        minimized: false
      });
    }
  },

  /**
   * Minimize the panel.
   * @instance
   */
  minimize: function () {
    if (!this.state.minimized) {
      this.setState({
        minimized: true
      });
    }
  },

  /**
   * Generate specification object for alert panel
   * @instance
   */
  getAlertOptions: function() {
    return {
      visible: this.state.alertVisible,
      confirm: true,
      message: "Du har en aktiv redigeringssession startad, vill du avbryta?",
      denyAction: () => {
        this.props.model.set('alert', false);
        this.props.model.deny();
      },
      confirmAction: () => {
        this.props.model.set('alert', false);
        this.props.model.ok();
      }
    }
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {

    var classes = this.state.toggled ? 'navigation-panel' : 'navigation-panel folded';

    if (this.state.minimized) {
      classes += " minimized btn btn-default fa fa-expand";
    }

    var panelInstance = null;
    var Panel = null;

    if (this.state.activePanel) {
      Panel = panels[this.state.activePanel.type.toLowerCase()];
      panelInstance = (
        <Panel
          model={this.state.activePanel.model}
          minimized={this.state.minimized}
          navigationPanel={this}
          onCloseClicked={_.bind(this.toggle, this)}
        />
      )
    }

    return (
      <div>
        <Alert options={this.getAlertOptions()} />
        <div className={classes} onClick={this.maximize}>
          {panelInstance}
        </div>
      </div>
    );
  }
};

/**
 * NavigationPanelView module.<br>
 * Use <code>require('views/navigationpanel')</code> for instantiation.
 * @module NavigationPanelView-module
 * @returns {NavigationPanelView}
 */
module.exports = React.createClass(NavigationPanelView);
