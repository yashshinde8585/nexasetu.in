import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  hover = true,
  as: Component = 'div',
  ...props
}) => {
  const baseStyles =
    'relative overflow-hidden rounded-xl border border-border-subtle transition-all duration-200';

  const variants = {
    default: 'bg-card text-text',
    glass: 'bg-background-elevated/70 backdrop-blur-md text-text',
    primary: 'bg-primary/5 border-primary/20 text-text',
    secondary: 'bg-background-elevated border-border-subtle text-text',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  const hoverStyles = hover
    ? 'hover:border-border hover:shadow-md'
    : '';

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'glass', 'primary', 'secondary']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  className: PropTypes.string,
  hover: PropTypes.bool,
  as: PropTypes.elementType,
};

export default Card;
