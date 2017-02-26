import React from 'react'
import ReactDOM from 'react-dom'
import Tools from './components/Tools.js'
import Editor from './components/Editor.js'
import Row from './components/Row.js'
import Column from './components/Column.js'
import Pagination from './components/Pagination.js'
import classNames from 'classnames/bind';
import styles from './css/styles.css'
import {DataException} from './components/Exceptions';

var CommonConstants = require('./components/CommonConstants');

export class Header extends React.Component {
  render() {
    let sorting = this.props.gteSort === CommonConstants.SORTABLE;
    let thClasses = classNames({
      gt_head_tr_th: true,
      sorting: sorting ? true : false
    });
    return (
      <th className={thClasses} style={(sorting) ? {cursor:"pointer"} : {cursor:"default"}}>
        <div className={styles.gt_th_box}>{this.props.children}</div>
      </th>
    )
  }
}

class Reactables extends React.Component {

  constructor(props)
  {
    super(props);
    // props = {
    // };
    this.state = {
      dataRows:null,
      countRows:0,
      perPage:50,
      page:1
    }
    this.build();
  }

  build()
  {
    fetch(this.props.settings.ajax).then(response => response.json())
    .then((data) => {
      this.createTable(data);
    });
  }

  createTable(data)
  {
    if(typeof data['rows'] === CommonConstants.UNDEFINED) {
      throw new DataException('JSON must contain "rows" field');
    }
    let rows = [];
    let dataJson = data['rows'];
    // process rows
    data['rows'].map((object, objectIndex) => {
        let cols = [];
        let rowId = 0;
        // perform id check
        if(typeof object[CommonConstants.GT_ROW_ID] !== CommonConstants.UNDEFINED) {
            rowId = object[CommonConstants.GT_ROW_ID];
        } else if (typeof object['id'] !== CommonConstants.UNDEFINED) {
            rowId = object['id'];
        } else {
            throw new DataException('You have neither "GT_RowId" nor "id" in json structure.');
        }
        // process cols
        this.props.settings.columns.map((column, index) => {
          // check if a JSON object has this data field
          if(typeof object[column['data']] !== CommonConstants.UNDEFINED)
          {
            cols.push(<Column dataIndex={column['data']} key={index}>{object[column['data']]}</Column>);
          }
        });
        // console.log(object);
        rows.push(<Row key={objectIndex} count={objectIndex} gteRowId={rowId}>{cols}</Row>);
    });
    this.setState({
      dataRows:rows,
      countRows:data['rows'].length
    });
  }

  handlePagination(e)
  {
    console.log(e.target.dataset.from);
    this.setState({
      page: e.target.dataset.from / this.state.perPage
    });
  }

  render() {
      // var tHead = React.Children.only(this.props.children[0]);
      // var clonnedTHead = React.cloneElement(tHead, {
      //   className: "input-element test"
      // });
      // var tFoot = React.Children.only(this.props.children[1]);
      // var clonedTFoot = React.cloneElement(tFoot, {
      //   className: "some_class"
      // });
      let dataJsonman = this.state.dataJsonman;
      return (
        <div className={styles.gt_container} style={{width: "1128px"}}>
          <div className={styles.gt_head_tools}>
            <Tools tableOpts={this.props.settings.tableOpts} perPageRows={this.props.settings.perPageRows}
            defaultPerPage={this.props.settings.defaultPerPage} />
          </div>
          <table id="gigatable" className={styles.gigatable}>
            <thead className={styles.gt_head}>
              <tr className={styles.gt_head_tr}>
                {
                  this.props.children.map((th, index) => {
                    var thh = React.Children.only(th);
                    var clonedOpts = {
                      key: index
                    };
                    if(typeof this.props.settings.columns[index][CommonConstants.SORTABLE] === CommonConstants.UNDEFINED
                    || this.props.settings.columns[index][CommonConstants.SORTABLE] === true) {
                      // set gteSort for <Header> which should be sorted
                      clonedOpts['gteSort'] = CommonConstants.SORTABLE;
                    }
                    return React.cloneElement(thh, clonedOpts);
                  })
                }
              </tr>
            </thead>
            <tbody className={styles.gt_body}>
                {this.state.dataRows}
            </tbody>
            <tfoot>
              <tr>
                {
                  this.props.children.map((th, index) => {
                    var thh = React.Children.only(th);
                    var clonedOpts = {
                      key: index
                    };
                    if(typeof this.props.settings.columns[index][CommonConstants.SORTABLE] === CommonConstants.UNDEFINED
                    || this.props.settings.columns[index][CommonConstants.SORTABLE] === true) {
                      // set gteSort for <Header> which should be sorted
                      clonedOpts['gteSort'] = CommonConstants.SORTABLE;
                    }
                    return React.cloneElement(thh, clonedOpts);
                  })
                }
              </tr>
            </tfoot>
          </table>
          <div className={styles.gt_pagination}>
            <Pagination updatePagination={this.handlePagination.bind(this)} countRows={this.state.countRows} page={this.state.page} perPage={this.state.perPage} />
          </div>
          <div className={styles.gt_foot_tools}>
            <Tools tableOpts={this.props.settings.tableOpts} perPageRows={this.props.settings.perPageRows}
            defaultPerPage={this.props.settings.defaultPerPage}/>
          </div>
        </div>
      )
  }
}

Reactables.propTypes = {
  editor: React.PropTypes.object,
  settings: React.PropTypes.object.isRequired
}

export default Reactables
