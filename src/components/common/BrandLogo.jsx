import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import lightLogoSrc from '/assets/newTransparentLogo.png';
import darkLogoSrc from '/assets/darkModeLogo.png';

/**
 * The WatermelonHub logo, in the variant for the current theme. Clicking it
 * reloads the page, keeping the current URL, so the user stays where they are.
 */
export function BrandLogo({ className = '' }) {
  const { theme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      title="Refresh page"
      aria-label="Refresh page"
      className="flex-shrink-0 min-w-0 rounded-md cursor-pointer transition-transform duration-150 ease-out hover:scale-[1.04] motion-reduce:transition-none"
    >
      <img
        src={theme === 'dark' ? darkLogoSrc : lightLogoSrc}
        alt="WatermelonHub"
        className={`w-auto object-contain ${className}`}
      />
    </button>
  );
}
