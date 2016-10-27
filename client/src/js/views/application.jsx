var Shell = require('views/shell');
var ShellModel = require('models/shell');

/**
 * Application view
 * @class
 * @augments {external:"Backbone.View"}
 */
var ApplicationView = {
  /**
   * @property {string} el - DOM element to render this app into.
   * @instance
   */
  el: "map",
  /**
   * Load the application.
   * @instance
   * @param {object} config
   * @param {boolean} isBookmark
   * @param {object[]} bookmars
   */
  load: function (config, isBookmark, bookmarks) {
    this.shell = new ShellModel(config);
    this.shell.setBookmarks(bookmarks);
    this.shell.on('change:configUpdated', () => {
      var currentBookmarks = this.shell.getBookmarks();
      this.load(this.shell.getConfig(), true, currentBookmarks);
    });
    if (isBookmark) {
      this.render(true);
    }
  },

  initialize: function (config, bookmarks) {
    this.load(config, false, bookmarks);
  },
  /**
   * Render the view
   * @instance
   * @param {boolean} force - Force update
   */
  render: function (force) {

    var el = document.getElementById(this.$el.selector);
    var errorStyle = { 'margin-top': '50px', 'text-align': 'center' };

    if (!el) {
      return alert("Applikationen har stannat. Försök igen senare.");
    }

    if (force) {
      ReactDOM.unmountComponentAtNode(el);
    }

    if (this.shell.get('canStart')) {
      ReactDOM.render(<Shell model={this.shell} />, el);
    } else {
      ReactDOM.render(
        <div className="container">
          <div className="alert alert-danger" style={errorStyle}>
            <h2>Kartan kunde inte startas upp.</h2>
            <p>Var god kontakta systemadminstratören.</p>
          </div>
        </div>,
        el
      );
    }
  }
};

/**
 * ApplicationView module.<br>
 * Use <code>require('views/application')</code> for instantiation.
 * @module ApplicationView-module
 * @returns {ApplicationView}
 */
module.exports = Backbone.View.extend(ApplicationView);
