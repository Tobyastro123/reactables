import React from 'react'
import ReactDOM from 'react-dom'
import Row from './Row.js'
import Column from './Column.js'

var CommonConstants = require('./CommonConstants');
var EditorConstants = require('./EditorConstants');
var Lang = require('./Lang');

class Main extends React.Component {

  constructor(props)
  {
    super(props);
    // init search flags
    this.nothing = false,
    this.tOut = [], this.c = 0;
  }

  setSearchableCols(object)
  {
    this.searchableCols[object[CommonConstants.DATA]] = false;
    if(typeof object[CommonConstants.SEARCHABLE] === CommonConstants.UNDEFINED
    || object[CommonConstants.SEARCHABLE] === true) {
      this.searchableCols[object[CommonConstants.DATA]] = true;
    }
  }

  setSearchableCase(object)
  {
      // common search
      this.searchableCase[object[CommonConstants.DATA]] = true; // case sensitive
      if(typeof object[CommonConstants.CASE_INSENSITIVE_SEARCH] !== CommonConstants.UNDEFINED
      && object[CommonConstants.CASE_INSENSITIVE_SEARCH] === true) {
        this.searchableCase[object[CommonConstants.DATA]] = false; // case insensitive
      }
      // discrete search
      this.discreteSearchableCase[object[CommonConstants.DATA]] = true;
      if(typeof object[CommonConstants.DISCRETE_CASE_INSENSITIVE_SEARCH] !== CommonConstants.UNDEFINED
      && object[CommonConstants.DISCRETE_CASE_INSENSITIVE_SEARCH] === true) {
        this.discreteSearchableCase[object[CommonConstants.DATA]] = false;
      }
  }

  setVisibleCols(object)
  {
    this.visibleCols[object[CommonConstants.DATA]] = true;
    if(typeof object[CommonConstants.VISIBLE] !== CommonConstants.UNDEFINED
    && object[CommonConstants.VISIBLE] === false) {
      this.visibleCols[object[CommonConstants.DATA]] = false;
      this.sortableCols[object[CommonConstants.DATA]] = false;
      this.searchableCols[object[CommonConstants.DATA]] = false;
    }
  }

  setSortableCols(object)
  {
    this.sortableCols[object[CommonConstants.DATA]] = false;
    if(typeof object[CommonConstants.SORTABLE] === CommonConstants.UNDEFINED
    || object[CommonConstants.SORTABLE] === true) {
      this.sortableCols[object[CommonConstants.DATA]] = true;
    }
  }

  setCustomColumns(object)
  {
    this.customColumns[object[CommonConstants.TARGET]] = object[CommonConstants.RENDER];
  }

  doSearch(e)
  {
    let keyCode = e.keyCode;
    if (CommonConstants.SYMBOLLESS_KEYS.indexOf(keyCode) !== -1) {
        return; // exit - user pressed not a symbol key(s)
    }

    var that = this;
    let name = e.target.name,
    val = e.target.value,
    len = val.length;
    this.nowMillis = (new Date()).getTime();
    var period = this.nowMillis - this.lastTimeKeyup;
    this.setState({
      [name]: val
    });

    if (val === '' && (keyCode === CommonConstants.BACKSPACE_KEY || keyCode === CommonConstants.DELETE_KEY)) { // rebuild full table if teared down
        this.createTable(this.jsonData, this.state.sortedButtons);
        return;
    }

    var nJson = [], str = '', i = 0, json = this.jsonData;
    for (let key in json) {
        for (let k in json[key]) {
            if (k !== CommonConstants.GT_ROW_ID && this.searchableCols[k] === true) { // do not search unsearchable
                str = json[key][k] + '';
                if (this.searchableCase[k] === false) {// case insensitive
                  if (str.toLowerCase().indexOf(val.toLowerCase()) !== -1) {
                    nJson[i] = json[key];
                    ++i;
                    break;
                  }
                } else {
                  if (str.indexOf(val) !== -1) {
                    nJson[i] = json[key];
                    ++i;
                    break;
                  }
                }
            }
        }
    }

    if (period > CommonConstants.PERIOD_SEARCH) {// show quick results and tear down all timeouts if they are present
        for (var j in this.tOut) {
            clearTimeout(this.tOut[j]);
        }
        this.tOut = [];
        this.c = 0;
        this.createTable(nJson, this.state.sortedButtons, this.state.selectedRows);
    } else {
        this.tOut[this.c] = setTimeout(function () {
            that.createTable(nJson, that.state.sortedButtons, that.state.selectedRows);
        }, CommonConstants.TIMEOUT_SEARCH);
        this.c++;
    }
    this.setState({
      dataSearch: nJson
    });

    this.lastTimeKeyup = this.nowMillis;
  }

  createTable(jsonData, sortedButtons, selectedRows)
  {
    const {
      dataSearch,
      perPage,
      fromRow,
      minRow,
      maxRow,
      scrolledDown
    } = this.state;
    let rows = [];
    if (dataSearch !== null) {
      jsonData = dataSearch;
    }
    let jsonDataPerPage = jsonData;
    if (jsonData.length > perPage) {
      let from = parseInt(fromRow),
      to = from + parseInt(perPage);

      if (scrolledDown === true) { // infiniteScroll cut
        jsonDataPerPage = jsonData.slice(0, to);
      } else { // classic pagination cut
        jsonDataPerPage = jsonData.slice(from, to);
      }
    }
    // process rows
    jsonDataPerPage.map((object, objectIndex) => {
        let cols = [], rowId = 0;
        rowId = this.getRowId(object);
        // process cols
        this.props.children.map((th, idx) => {
          const { data } = th.props;
          // check if a JSON object has this data field + visible
          if(typeof data !== CommonConstants.UNDEFINED && this.visibleCols[data] === true) {
            let content = null;
            if (typeof this.customColumns[data] !== CommonConstants.UNDEFINED
              && typeof this.customColumns[data] === CommonConstants.FUNCTION) { // custom column
              content = this.customColumns[data](object[data], object, data);
            } else {
              content = object[data];
            }
            cols.push(<Column
              dataIndex={data}
              selectedRows={(typeof selectedRows !== CommonConstants.UNDEFINED) ? selectedRows : this.state.selectedRows}
              minRow={minRow}
              maxRow={maxRow}
              count={objectIndex}
              gteRowId={rowId}
              key={idx}>{content}</Column>);
          }
        });
        // count is used to shft key + click selection of rows, ex.: sorted
        rows.push(<Row
          clickedRow={this.clickedRow.bind(this)}
          selectedRows={(typeof selectedRows !== CommonConstants.UNDEFINED) ? selectedRows : this.state.selectedRows}
          minRow={minRow}
          maxRow={maxRow}
          key={objectIndex}
          count={objectIndex}
          gteRowId={rowId}>{cols}</Row>);
    });
    let state = {
      dataRows:rows,
      countRows:jsonData.length
    };
    if(typeof sortedButtons !== CommonConstants.UNDEFINED) {
      state['sortButtons'] = sortedButtons;
    }
    this.setState(state);
  }

  getRowId(object)
  {
    let rowId = 0;
    // perform id check
    if(typeof object[CommonConstants.GT_ROW_ID] !== CommonConstants.UNDEFINED) {
        rowId = object[CommonConstants.GT_ROW_ID];
    } else if (typeof object['id'] !== CommonConstants.UNDEFINED) {
        rowId = object['id'];
    } else {
        throw new DataException('You have neither "GT_RowId" nor "id" in json structure.');
    }
    return rowId;
  }

  clickedRow(e)
  {
    const {
      selectedRows,
      selectedIds,
      sortedButtons,
      ctrlDown,
      shiftDown
    } = this.state;
    const { rowid, realid } = e.target.dataset;

    let rows = selectedRows,
    ids = selectedIds;
    let min = 0, max = 0,
    rowId = parseInt(rowid),
    realId = parseInt(realid);

    if (rows.length > 0 && rows.indexOf(rowId) !== -1
      && ctrlDown === false) { // if row is active - remove it
      rows = rows.splice(rowId, 1);
      ids = ids.splice(realId, 1);
      this.state.selectedRows = rows;
      this.state.selectedIds = ids;
    } else {
      if (ctrlDown === true) {
        rows.push(parseInt(rowid));
        ids.push(parseInt(realid));
      } else if (shiftDown === true) {
        rows.push(parseInt(rowid));
        ids.push(parseInt(realid));
        min = rows[0], max = rows[0];
        for (var row in rows) {
          if (rows[row] < min) {
            min = rows[row];
          }
          if (rows[row] > max) {
            max = rows[row];
          }
        }
        rows = [], this.state.selectedRows = [];
        // fill in the items
        for (var i = min; i <= max;++i) {
          rows.push(i);
        }
        this.state.selectedRows = rows;
      } else { // if just a click override prev
        rows = [parseInt(rowid)];
        ids = [parseInt(realid)];
      }
    }
    // we can't use the state for selectedRows here because of state latency
    this.createTable(this.jsonData, sortedButtons, rows);
    this.setState({
      selectedRows: rows,
      selectedIds: ids
    }, () => {
      // use querySelector to gather all active rows
      if (shiftDown === true) {
        let arr = document.querySelectorAll('tr.active'), innerIds = [];
        for (let k in arr) {
          if (typeof arr[k].dataset !== CommonConstants.UNDEFINED) {
            innerIds.push(parseInt(arr[k].dataset.realid));
          }
        }
        this.setState({
          selectedIds: innerIds
        });
      }
    });
  }

  getButtonsState(indexData, value)
  {
    const { sortButtons } = this.state;
    let buttons = [];
    for (let key in sortButtons) {
      buttons[key] = sortButtons[key];
      if (key === indexData) {
        buttons[key] = value;
      }
    }
    return buttons;
  }

  editorUpdate(e, dataIndices)
  {
    let action = e.target.dataset.action,
    rowId = 0,
    selectedRows = this.state.selectedRows;

    if (action === EditorConstants.ACTION_DELETE) {
      for (var dataKey in dataIndices) {
        for (var key in this.jsonData) {
          if(typeof this.jsonData[key][CommonConstants.GT_ROW_ID] !== CommonConstants.UNDEFINED) {
              rowId = this.jsonData[key][CommonConstants.GT_ROW_ID];
          } else if (typeof this.jsonData[key]['id'] !== CommonConstants.UNDEFINED) {
              rowId = this.jsonData[key]['id'];
          }
          if (dataIndices[dataKey] === rowId) {
            selectedRows.splice(selectedRows.indexOf(key), 1);
            this.jsonData.splice(key, 1);
          }
        }
      }
    } else if (action === EditorConstants.ACTION_CREATE) {
      this.jsonData.unshift(dataIndices);
    } else if (action === EditorConstants.ACTION_EDIT) {
      for (var key in dataIndices) {
        this.jsonData[this.state.selectedRows[0]][key] = dataIndices[key];
      }
    }
    this.createTable(this.jsonData, this.state.sortedButtons);
    this.setState({
      selectedRows: selectedRows
    });
    this.hidePopup();
  }

  handlePagination(e)
  {
    const { from } = e.target.dataset;
    const { perPage, sortedButtons } = this.state;
    this.setState({
      fromRow: parseInt(from),
      page: parseInt(from / perPage + 1),
      selectedRows: [],
      selectedIds: []
    }, () => {this.createTable(this.jsonData, sortedButtons)});
  }

  updatePerPage(e)
  {
    this.setState({
        perPage: parseInt(e.target.value)
      }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
  }

  showPopup(e)
  {
    this.lang = Lang[this.settings.lang];
    let action = e.target.dataset.action,
    popup_title = this.lang.gte_editor_popupheader_create,
    popup_button = this.lang.gte_editor_sendbtn_create;
    let fieldsEdit = {};

    if (action === EditorConstants.ACTION_EDIT) {
      popup_title = this.lang.gte_editor_popupheader_edit;
      popup_button = this.lang.gte_editor_sendbtn_update;
      // collect data for fields filling in Editor
      for (var k in this.jsonData) {
        if (parseInt(k) === parseInt(this.state.selectedRows[0])) {
          fieldsEdit = this.jsonData[k];
        }
      }
    } else if (action === EditorConstants.ACTION_DELETE) {
      popup_title = this.lang.gte_editor_popupheader_delete;
      popup_button = this.lang.gte_editor_sendbtn_delete;
    }
    e.preventDefault();
    this.setState({
      action: action,
      active: true,
      popup_title: popup_title,
      popup_button: popup_button,
      opacity: 1,
      fieldsEdit: fieldsEdit
    });
  }

  hidePopup()
  {
    this.setState({
      active: false
    });
  }

  setTableSort(indexData, e)
  {
    if (this.state.discreteFocus === true) {
      return;
    }

    const { columns } = this.settings;
    if (typeof e === CommonConstants.UNDEFINED) { // on start-up - setting default
      let sortedButtons = [];
      this.props.children.map((th, index) => {
        const { data } = th.props;
        if(typeof data !== CommonConstants.UNDEFINED) {
          columns.map((column, colIdx) => {
            if(column[CommonConstants.DATA] === data
              && (typeof column[CommonConstants.SORTABLE] === CommonConstants.UNDEFINED
                || column[CommonConstants.SORTABLE] === true)) {
              sortedButtons[data] = 0; // 0 - none, 1 - asc, -1 - desc
            }
          });
        }
      });
      this.setState({
        sortButtons : sortedButtons
      });
    } else { // clicked
      this.nowMillis = (new Date()).getTime();
      let period = this.nowMillis - this.lastTimeKeyup;

      if (period > CommonConstants.SORT_PERIOD) {
      this.props.children.map((th, idx) => {
        var that = this;
        const { sortButtons, dataSearch } = that.state;
        const { data } = th.props;

        let cols = columns,
        sJson = that.jsonData,
        sortedButtons = [];
        if (dataSearch !== null) {
          sJson = dataSearch;
        }
        // check and sort for other columns
        // if (typeof sortButtons[data] !== CommonConstants.UNDEFINED
        //   && sortButtons[data] !== 0
        //   && data !== indexData) {
        //     if (sortButtons[data] === 1) {
        //       sJson = this.sortAsc(data, sJson);
        //     } else {
        //       sJson = this.sortDesc(data, sJson);
        //     }
        // }

        if (indexData === data) { // iff the cols match
          if (sortButtons[data] === 1) {
            sortedButtons = that.getButtonsState(indexData, -1);
            sJson = this.sortDesc(data, sJson);
          } else { // if 0 || -1 = 1
            sortedButtons = that.getButtonsState(indexData, 1);
            sJson = this.sortAsc(data, sJson);
          }
          that.createTable(sJson, sortedButtons);
        }
      });
      }
      this.lastTimeKeyup = this.nowMillis;
    }
  }

  sortAsc(data, sJson)
  {
    let check = 0, isNan = 0;
    sJson.sort(function (a, b) {
      a = (a[data] === null) ? '' : a[data] + '';
      b = (b[data] === null) ? '' : b[data] + '';
      if (check === 0) { // check just the 1st time
        if (isNaN(a - b)) {
          isNan = 1;
        }
        check = 1;
      }
      if (isNan) {
        return a.localeCompare(b);
      }
      return a - b;
    });
    return sJson;
  }

  sortDesc(data, sJson)
  {
    let check = 0, isNan = 0;
    sJson.sort(function (a, b) {
      a = (a[data] === null) ? '' : a[data] + '';
      b = (b[data] === null) ? '' : b[data] + '';
      if (check === 0) { // check just the 1st time
          if (isNaN(a - b)) {
              isNan = 1;
          }
          check = 1;
      }
      if (isNan) {
          return b.localeCompare(a);
      }
      return b - a;
    });
    return sJson;
  }

  doDiscreteSearch(e)
  {
    let keyCode = e.keyCode;
    if (CommonConstants.SYMBOLLESS_KEYS.indexOf(keyCode) !== -1) {
        return; // exit - user pressed not a symbol key(s)
    }

    var that = this;

    let name = e.target.name,
    val = e.target.value,
    data = e.target.dataset.index,
    len = val.length;

    this.nowMillis = (new Date()).getTime();
    var period = this.nowMillis - this.lastTimeKeyup;

    this.setState({columnsSearch:
      Object.assign({}, this.state.columnsSearch, {
        [name]: val
      })
    });

    if (val === '' && (keyCode === CommonConstants.BACKSPACE_KEY || keyCode === CommonConstants.DELETE_KEY)) { // rebuild full table if teared down
        this.createTable(this.jsonData, this.state.sortedButtons);
        return;
    }

    var nJson = [], str = '', i = 0, json = this.jsonData;
    for (let key in json) {
        for (let k in json[key]) {
            if (k !== CommonConstants.GT_ROW_ID && this.searchableCols[k] === true
                && k === data) { // do not search unsearchable and only this column
                str = json[key][k] + '';
                if (this.discreteSearchableCase[k] === false) {// case insensitive
                    if (str.toLowerCase().indexOf(val.toLowerCase()) !== -1) {
                      nJson[i] = json[key];
                      ++i;
                      break;
                    }
                } else {
                    if (str.indexOf(val) !== -1) {
                      nJson[i] = json[key];
                      ++i;
                      break;
                    }
                }
            }
        }
    }
    if (period > CommonConstants.PERIOD_SEARCH) {// show quick results and tear down all timeouts if they are present
        for (var j in this.tOut) {
            clearTimeout(this.tOut[j]);
        }
        this.tOut = [];
        this.c = 0;
        this.createTable(nJson, this.state.sortedButtons, this.state.selectedRows);
    } else {
        this.tOut[this.c] = setTimeout(function () {
            that.createTable(nJson, that.state.sortedButtons, that.state.selectedRows);
        }, CommonConstants.TIMEOUT_SEARCH);
        this.c++;
    }

    this.setState({
      dataSearch: nJson
    });
    this.lastTimeKeyup = this.nowMillis;
  }

  setHeads()
  {
    const { sortButtons } = this.state;
    const { columns } = this.settings;
    let sortedCols = [];

    this.props.children.map((th, index) => {
    const { data } = th.props;
    if (typeof data !== CommonConstants.UNDEFINED
        && this.visibleCols[data] === true) {
      var thh = React.Children.only(th);
      var clonedOpts = {
        key: index,
        sortId: index+'',
        sortDirection: (typeof sortButtons[data] === CommonConstants.UNDEFINED) ? sortButtons[data] : 0
      };
        clonedOpts['columns'] = columns;
        if (this.searchableCols[data] === true) {
          clonedOpts['doDiscreteSearch'] = this.doDiscreteSearch.bind(this);
          clonedOpts['discreteFocus'] = this.discreteFocus.bind(this);
          clonedOpts['discreteBlur'] = this.discreteBlur.bind(this);
          clonedOpts['columnsSearch'] = this.state.columnsSearch;
        }
        if (this.sortableCols[data] === true) {
          clonedOpts['gteSort'] = CommonConstants.SORTABLE;
          if(typeof sortButtons[data] !== CommonConstants.UNDEFINED) {
            clonedOpts['updateSort'] = this.setTableSort.bind(this, data);
            clonedOpts['sortDirection'] = sortButtons[data];
          }
        }
        sortedCols[index] = React.cloneElement(thh, clonedOpts);
      }
    })
    return sortedCols;
  }

  discreteFocus()
  {
    this.setState({
      discreteFocus: true
    });
  }

  discreteBlur()
  {
    this.setState({
      discreteFocus: false
    });
  }

  setLoader(cols)
  {
    let
      minRow = 0,
      maxRow = 1,
      objectIndex = 1,
      rowId = 1,
      rowsData = <Row
      selectedRows={(typeof selectedRows !== CommonConstants.UNDEFINED) ? selectedRows : this.state.selectedRows}
      minRow={minRow}
      maxRow={maxRow}
      key={objectIndex}
      count={objectIndex}
      gteRowId={rowId}>
        <td colSpan={cols}><div style={{textAlign: 'center'}}>Loading...</div></td>
      </Row>;
      this.setState({
        dataRows: rowsData
      });
  }

  addSelectedRows()
  {
    const {
      selectedRows,
      shiftDown,
      ctrlDown,
      arrowUp,
      arrowDown,
      perPage,
      aDown
    } = this.state;

    if (shiftDown === true && arrowUp === true && selectedRows.length > 0) {
      let min = Math.min(...selectedRows),
      rows = selectedRows;
      if (min > 0) {
        rows.push(min-1);
        this.setState({
          selectedRows: rows
        }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
      }
    } else if (arrowDown === true && shiftDown === true && selectedRows.length > 0) {
      let max = Math.max(...selectedRows),
      rows = selectedRows;
      if (max < perPage - 1) {
        rows.push(max+1);
        this.setState({
          selectedRows: rows
        }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
      }
    } else if (ctrlDown === true && aDown === true) {
      let rows = [];
      for (let i = 0;i < perPage;++i) {
        rows[i] = i;
      }
      this.setState({
        selectedRows: rows
      }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
    }
  }

  setPagination()
  {
    const {
      ctrlDown,
      arrowLeft,
      arrowRight,
      fromRow,
      page,
      perPage,
      countRows
    } = this.state;

    // let fromRow = parseInt(fromRow);
    if (ctrlDown === true && arrowLeft === true) {
      if (page === 1) {
        let pages = Math.ceil(countRows / perPage);
        this.setState({
          fromRow: (pages - 1) * perPage,
          page: pages,
          arrowLeft: false
        }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
      } else {
        this.setState({
          fromRow: (page - 1) * perPage,
          page: page - 1,
          arrowLeft: false
        }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
      }
    } else if (ctrlDown === true && arrowRight === true) {
      let pages = Math.ceil(countRows / perPage);
      if (page === pages) {
        this.setState({
          fromRow: 0,
          page: 1,
          arrowRight: false
        }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
      } else {
        this.setState({
          fromRow: page * perPage,
          page: page + 1,
          arrowRight: false
        }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
      }
    }
  }

  handleScroll(that)
  {
    const {
      fromRow,
      perPage,
      countRows
    } = this.state;

    if ((fromRow + perPage) >= countRows) {
      return;
    }

    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;

    if (windowBottom >= docHeight) {
      this.setState({
        fromRow: fromRow + perPage,
        scrolledDown: true
      }, () => {this.createTable(this.jsonData, this.state.sortedButtons)});
    } else {
      this.setState({
        scrolledDown: false
      });
    }
  }

}

export default Main
