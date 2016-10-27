var Panel = require('views/panel');
var SearchResultGroup;

var isMobile = () => document.body.clientWidth <= 600;

SearchResultGroup = React.createClass({

  componentDidMount: function () {

    var groups = $(ReactDOM.findDOMNode(this)).find('.group');

    groups.click(function() {
      $(this).next().toggleClass('hidden');
    });

    if (this.props.model.get('selectedIndices') instanceof Array) {
      _.each(groups, group => {
        var res = this.props.model.get('selectedIndices').filter(item => group.id === item.group);
        if (res.length > 0) {
          let nth = res[0].index + 1;
          let elem = $(group).next().find('div:nth-child(' + nth + ')');
          elem.addClass('selected');
        }
      });
    }
  },

  handleClick: function (hit, index, event) {

    var element = $(event.target)
    ,   parent = $(ReactDOM.findDOMNode(this))
    ,   group = parent.find('.group');

    parent.find('div').each(function () { $(this).removeClass('selected') });
    element.addClass('selected');

    this.props.model.focus({
      index: index,
      hits: this.props.result.hits,
      hit: hit,
      id: group[0].id
    });

    if (isMobile()) {
      console.log(this.props);
      this.props.parentView.props.navigationPanel.minimize();
    }
  },

  render: function () {

    var id = this.props.id
    ,   groupStyleClass = this.props.numGroups === 1 ? "" : "hidden"
    ;

    return (
      <div>
        <div className="group" id={this.props.id}>{this.props.result.layer}
          <span className="label">{this.props.result.hits.length}</span>
        </div>
        <div className={groupStyleClass}>
          {
            this.props.result.hits.map((hit, i) => {
              function getTitle(property) {
                if (Array.isArray(property)) {
                  return property.map(item => hit.getProperties()[item]).join(', ');
                } else {
                  return hit.getProperties()[property] || property
                }
              }
              var hitId = "hit-" + i + "-" + id
              ,   title = getTitle(this.props.result.displayName)
              ,   index = i
              ;
              return (<div key={hitId} index={i} onClick={this.handleClick.bind(this, hit, i)}>{title}</div>);
            })
          }
        </div>
      </div>
    );
  }
});

/**
 * @class
 */
var SearchPanelView = {
  /**
   * @property {string} value
   * @instance
   */
  value: undefined,

  /**
   * @property {number} timer
   * @instance
   */
  timer: undefined,

  /**
   * @property {number} loading
   * @instance
   */
  loading: 0,

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
    this.value = this.props.model.get('value');
    if (this.props.model.get('items')) {
      this.setState({
        showResults: true,
        result: {
          status: 'success',
          items: this.props.model.get('items')
        }
      });
    }
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function () {
    this.props.model.get('layerCollection') ?
      this.bindLayerVisibilityChange() :
      this.props.model.on('change:layerCollection', this.bindLayerVisibilityChange);
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.get('layerCollection').each((layer) => {
      layer.off("change:visible", this.search);
    });
    this.props.model.off('change:layerCollection', this.bindLayerVisibilityChange);
  },

  /**
   * Clear the search result.
   * @instance
   */
  clear: function () {
    this.value = "";
    this.props.model.set('value', "");
    this.props.model.clear();
    this.setState({
      loading: true,
      showResults: true,
      result: []
    });
  },

  /**
   * Handle key down event, this will set state.
   * @instance
   * @param {object} event
   */
  handleKeyDown: function (event) {
    if (event.keyCode === 13 && event.target.value.length < 5) {
      event.preventDefault();
      this.props.model.set('value', event.target.value);
      this.setState({
        force: true
      });
      this.search();
    }
  },

  /**
   * Perform a search in the model to update results.
   * @instance
   */
  update: function() {
    this.props.model.search();
  },

  /**
   * Search requested information.
   * @instance
   * @param {object} event
   */
  search: function (event) {
    this.setState({
      loading: true
    });
    this.loading = Math.random();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var loader = this.loading;
      this.props.model.abort();
      this.props.model.search(result => {
        var state = {
          loading: false,
          showResults: true,
          result: result
        };
        if (loader !== this.loading) {
          state.loading = true;
        }
        this.setState(state);
      });
    }, 200);
  },

  /**
   * Bind an event handler to layer visibility change.
   * If a layer changes visibility the result vill update.
   * @instance
   */
  bindLayerVisibilityChange : function () {
    this.props.model.get('layerCollection').each((layer) => {
      layer.on("change:visible", () => {
        this.update();
      });
    });
  },

  /**
   * Set search filter and perform a search.
   * @instance
   * @param {string} type
   * @param {object} event
   */
  setFilter: function (type, event) {
    switch (type) {
      case "layer":
        this.props.model.set('filter', event.target.value);
        break;
      case "visible":
        this.props.model.set('filterVisible', event.target.checked);
        break;
    }
    this.search();
  },

  /**
   * Render the search options component.
   * @instance
   * @return {external:ReactElement}
   */
  renderOptions: function () {
    var settings = this.props.model.get('settings')
    ,   sources = this.props.model.get('sources')
    ;
    return (
      <div>
        <div>
          <span>Sök: </span>&nbsp;
          <select value={this.props.model.get('filter')} onChange={this.setFilter.bind(this, "layer")}>
            <option value="*">--  Alla  --</option>
            {
              (() => {
                return sources.map((wfslayer, i) => {
                  return (
                    <option key={i} value={wfslayer.caption}>
                      {wfslayer.caption}
                    </option>
                  )
                })
              })()
            }
          </select>
        </div>
        <div style={{ display: 'none' }} className="panel-row">
          <label htmlFor="visible-layers">Sök endast i synliga lager</label>
          <input type="checkbox" checked={this.props.model.get('filterVisible')} onChange={this.setFilter.bind(this, "visible")} id="visible-layers"/>
        </div>
      </div>
    );
  },

  /**
   * Render the result component.
   * @instance
   * @return {external:ReactElement}
   */
  renderResults: function () {
    var groups = this.props.model.get('items')
    return (
      <div className="search-results" key="search-results">
        <h3>Sökresultat</h3>
        {
          (() => {
            if (groups && groups.length > 0) {
              return groups.map((item, i) => {
                var id = "group-" + i;
                return (
                  <SearchResultGroup
                        id={id}
                        key={id}
                        result={item}
                        numGroups={groups.length}
                        model={this.props.model}
                        parentView={this}
                        map={this.props.model.get('map')} />
                );
              });
            } else {
              return (<div>Sökningen gav inget resultat.</div>);
            }
          })()
        }
      </div>

    );
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {

    var results = null;
    var value = this.props.model.get('value');
    var showResults = value;
    var options = this.renderOptions();

    if (showResults) {
      if (this.state.loading) {
        results = (
          <p>
            <span className="sr-only">Laddar...</span>
            <i className="fa fa-refresh fa-spin fa-3x fa-fw"></i>
          </p>
        );
      } else {
        if ((this.refs.searchInput &&
             this.refs.searchInput.value.length > 3) ||
             this.state.force) {
          results = this.renderResults();
        } else {
          results = (
            <p className="alert alert-info">
              Skriv minst fyra tecken för att påbörja automatisk sökning. Tryck på <b>retur</b> för att forcera en sökning.
            </p>
          )
        }

      }
    }

    var search_on_input = (event) => {
      this.value = event.target.value;
      this.props.model.set('value', this.value);
      this.setState({
        value: this.value,
        force: false
      });

      if (this.refs.searchInput.value.length > 3) {
        this.search();
      } else {
        this.setState({
          loading: false
        });
      }
    };

    return (
      <Panel title="Sökning" onCloseClicked={this.props.onCloseClicked} minimized={this.props.minimized}>
        <div className="search-tools">
          <div className="form-group">
          {options}
          <br />
            <div className="input-group">
              <div className="input-group-addon">
                <i className="fa fa-search"></i>
              </div>
              <input
                type="text"
                ref="searchInput"
                className="form-control"
                placeholder=""
                value={value}
                onKeyDown={this.handleKeyDown}
                onChange={search_on_input} />
            </div>
          </div>
          <button onClick={this.clear} type="submit" className="btn btn-default">Rensa</button>
          {results}
        </div>
      </Panel>
    );
  }
};

/**
 * SearchPanelView module.<br>
 * Use <code>require('views/searchpanel')</code> for instantiation.
 * @module SearchPanelView-module
 * @returns {SearchPanelView}
 */
module.exports = React.createClass(SearchPanelView);
