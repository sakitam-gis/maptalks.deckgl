/* eslint jsx-a11y/anchor-is-valid: 0 */
import React, { useEffect } from 'react';
import github from '../images/github.png';
import './header.less'

interface HeaderProps {
}

const Header: React.FC<HeaderProps> = ({}) => {
  useEffect(() => {
    return () => {
      // clearTimeout(timeout);
    };
  });

  return (
    <div className="header clearfix">
      <div className="navbar-collapse clearfix">
        <h4 className="navbar-left">maptalks.deckgl</h4>
        <ul className="nav navbar-nav navbar-right">
          <li id="nav-github">
            <a href="https://github.com/sakitam-gis/maptalks.deckgl" target="_blank">
              <img src={github} width="18"  alt="github"/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
