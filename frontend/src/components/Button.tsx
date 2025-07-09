import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'submit' | 'button' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  type = "submit", 
  onClick, 
  disabled = false,
  fullWidth = true,
  className = ""
}: ButtonProps) {
  return (
    <button 
      type={type} 
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {children}
    </button>
  );
}