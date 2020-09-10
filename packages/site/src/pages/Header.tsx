import React, { Component } from 'react'; // eslint-disable-line
// import logo from '../assets/images/logo.png';
import github from '../assets/images/github.png';
import '../assets/style/header.less';

interface IProps {

}

interface IState {

}

class Header extends Component<IProps, IState> {
  constructor (props: IProps, context?: any) {
    super(props, context);
    this.state = {}
  }

  componentDidMount () {
  }

  handleDefEvent (event: MouseEvent) {
    if (event.preventDefault) {
      event.preventDefault()
    } else {
      event.returnValue = false
    }
  }

  render () {
    return (
      <div className="header clearfix">
        <div className="navbar-collapse clearfix">
          <ul className="nav navbar-nav navbar-right">
            <li id="nav-github">
              <a href="https://github.com/sakitam-gis/maptalks.deckgl" target="_blank">
                <img src={github} width="18"  alt="github"/>
              </a>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

export default Header;
