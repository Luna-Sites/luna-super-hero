import React from 'react';
import PropTypes from 'prop-types';

Copyright.propTypes = {
  copyrightPosition: PropTypes.oneOf(['left', 'right']),
};

function Copyright({ children, ...rest }) {
  return (
    <div className={`copyright ${rest.copyrightPosition}`}>
      <div className={'wrapper'}>{children}</div>
    </div>
  );
}

Copyright.Prefix = ({ children, ...rest }) =>
  children ? (
    <span {...rest} className={'icon-prefix'}>
      {children}
    </span>
  ) : (
    ''
  );

Copyright.Icon = ({ children, ...rest }) => (
  <span {...rest} className={'icon-wrapper'}>
    {children}
  </span>
);

Copyright.Text = ({ children, ...rest }) => (
  <span {...rest} className={'icon-content'}>
    {children}
  </span>
);
export default Copyright;
