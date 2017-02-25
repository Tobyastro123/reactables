import React from 'react'
import styles from '../css/styles.css'
import classNames from 'classnames/bind'

export default class Row extends React.Component {
  clicked(e)
  {

  }

  render()
  {
    let rowClasses = classNames({
      even:(this.props.count % 2 === 0)?true:false,
      odd:(this.props.count % 2 === 0)?false:true,
    });
    // console.log(this.props.count);
    return (
      <tr className={rowClasses} onClick={this.clicked.bind(this)} data-row-id={this.props.gteRowId}>{this.props.children}</tr>
    )
  }
}
