import React from 'react';

const Button = ({ children, className = '', ...props }) => (
  <button 
    className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 focus:bg-white active:bg-white focus:text-black active:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
