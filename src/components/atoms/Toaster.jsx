import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

const Toaster = () => {
  return (
    <HotToaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-background-elevated, #161B22)',
          color: 'var(--color-text, #F8FAFC)',
          border: '1px solid var(--color-border-subtle, #292D33)',
          fontSize: '13px',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '10px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        },
        success: {
          iconTheme: {
            primary: 'var(--color-status-success, #4ADE80)',
            secondary: 'var(--color-background-elevated, #161B22)',
          },
        },
        error: {
          style: {
            border: '1px solid var(--color-status-error, #F87171)',
            background: 'var(--color-background-elevated, #161B22)',
            color: 'var(--color-text, #F8FAFC)',
          },
          iconTheme: {
            primary: 'var(--color-status-error, #F87171)',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
};

export default Toaster;
