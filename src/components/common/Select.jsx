import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown } from './Icons';

export function Select({
  value,
  onChange,
  options = [],
  children,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  size = 'md'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse options from children if options prop not passed
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) return options;
    const items = [];
    React.Children.forEach(children, child => {
      if (React.isValidElement(child) && child.type === 'option') {
        items.push({
          value: child.props.value !== undefined ? child.props.value : child.props.children,
          label: child.props.children
        });
      }
    });
    return items;
  }, [options, children]);

  // Find currently selected label
  const selectedOption = parsedOptions.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (parsedOptions[0]?.label || placeholder);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) {
      // Simulate standard event object for seamless compatibility with existing handlers
      onChange({ target: { value: optValue } });
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-xs sm:text-sm',
    lg: 'px-4 py-2.5 text-sm'
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col self-start ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${buttonClassName}`}
      >
        <span className="truncate">{displayLabel}</span>
        <IconChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* In-flow animated expanding menu strictly bounded to width */}
      <div
        className={`grid transition-all duration-200 ease-out w-full ${
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden w-full">
          <div
            className={`w-full bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1 overflow-hidden shadow-sm ${menuClassName}`}
          >
            <div className="max-h-60 overflow-y-auto py-0.5 divide-y divide-zinc-100 dark:divide-zinc-800/40">
              {parsedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 font-black text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-[#F7F8ED] dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 ml-2 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
