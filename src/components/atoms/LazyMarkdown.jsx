import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const ReactMarkdown = lazy(() => import('react-markdown'));

const LazyMarkdown = (props) => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-3 text-text-subtle text-xs font-medium">
          <Loader2 className="animate-spin text-primary" size={14} />
          <span>Rendering content...</span>
        </div>
      }
    >
      <ReactMarkdown {...props} />
    </Suspense>
  );
};

export default ReactMarkdown ? LazyMarkdown : null; // Support cases where import is pending
