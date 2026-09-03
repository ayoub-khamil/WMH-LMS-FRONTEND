import React from 'react';

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 rounded-md border select-none';

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variants = {
    // Watermelon Primary Action: Pastel Green Accent
    primary: 'bg-watermelon-green-400 hover:bg-watermelon-green-500 text-zinc-950 border-watermelon-green-500 font-semibold dark:bg-watermelon-green-400 dark:hover:bg-watermelon-green-300 dark:text-zinc-950 active:bg-watermelon-green-600',
    
    // Watermelon Subtle Green Action
    greenLight: 'bg-watermelon-green-50 hover:bg-watermelon-green-100 text-watermelon-green-900 border-watermelon-green-200 dark:bg-watermelon-green-950/50 dark:hover:bg-watermelon-green-900/60 dark:text-watermelon-green-200 dark:border-watermelon-green-800',

    // Destructive Action: Pastel Red Accent
    destructive: 'bg-watermelon-red-400 hover:bg-watermelon-red-500 text-zinc-950 border-watermelon-red-500 font-semibold dark:bg-watermelon-red-500 dark:hover:bg-watermelon-red-400 dark:text-white',
    
    // Watermelon Subtle Red Action
    redLight: 'bg-watermelon-red-50 hover:bg-watermelon-red-100 text-watermelon-red-900 border-watermelon-red-200 dark:bg-watermelon-red-950/50 dark:hover:bg-watermelon-red-900/60 dark:text-watermelon-red-200 dark:border-watermelon-red-800',

    // Monochrome High Contrast
    dark: 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 dark:border-zinc-100',
    
    // Flat Outline Monochrome with enhanced surface contrast
    secondary: 'bg-[#F7F8ED] hover:bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-700',
    
    // Ghost
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-700 border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.secondary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
