import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-sans font-medium border-2 border-gba-border transition-all duration-200 hover:scale-105 active:scale-95';
  
  const variants = {
    primary: 'bg-gba-highlight text-gba-border hover:bg-gba-accent',
    secondary: 'bg-gba-ui text-gba-text hover:bg-gba-highlight',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[44px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[44px]',
  };
  
  const disabledStyles = 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 hover:scale-100 active:scale-100';
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${props.disabled ? disabledStyles : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
