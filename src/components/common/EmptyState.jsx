import React from 'react';

export function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-md bg-[#F7F8ED]/50 dark:bg-zinc-900/30">
      {Icon && (
        <div className="p-3 mb-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-[#F7F8ED] dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
