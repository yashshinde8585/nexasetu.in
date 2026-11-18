import React from 'react';
import PropTypes from 'prop-types';

// Loading skeleton component.
const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-background-elevated/70 border border-border-subtle/30 rounded-md relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-border-subtle/30 to-transparent animate-shimmer" />
    </div>
  );
};

Skeleton.propTypes = {
  className: PropTypes.string,
};

export default Skeleton;
