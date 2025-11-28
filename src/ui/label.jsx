import React from 'react';

const Label = ({ children, className = '', ...props }) => (
  <label className={`block font-medium text-gray-700 ${className}`} {...props}>
    {children}
  </label>
);

export default Label;
