import React from 'react';
import { Box } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Box,
  title = 'No items found',
  message = 'There are no items to display in this view.',
  action = null,
}) => {
  return (
    <div className="py-12 sm:py-16 px-4 text-center bg-background-elevated/40 border border-dashed border-border-subtle rounded-md">
      <div className="flex justify-center mb-4">
        <div className="p-3.5 bg-background-elevated rounded-full border border-border-subtle inline-flex items-center justify-center">
          <Icon size={28} className="text-text-subtler" />
        </div>
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-text mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-text-subtle max-w-sm mx-auto leading-relaxed mb-5">
        {message}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
