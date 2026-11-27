import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PropTypes from 'prop-types';

// Back navigation button.
const BackButton = ({ onClick, className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className={`group flex items-center transition-colors outline-none cursor-pointer ${className}`}
    >
      <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-background-elevated border border-border-subtle flex items-center justify-center text-text-subtle group-hover:text-primary group-hover:border-primary/40 transition-all">
        <ArrowLeft size={16} />
      </div>
    </button>
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default BackButton;
