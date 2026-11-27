import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * ActionPortalMenu renders a floating menu via React Portal (document.body).
 * Automatically calculates viewport collision, flipping vertically and shifting horizontally
 * to prevent clipping by overflow-hidden/overflow-x-auto parent containers or window boundaries.
 */
export const ActionPortalMenu = ({
  triggerEl,
  isOpen,
  onClose,
  width = 192,
  className = '',
  children,
}) => {
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });

  const calculatePosition = useCallback(() => {
    if (!triggerEl) return;
    const triggerRect = triggerEl.getBoundingClientRect();

    // Close menu if trigger is scrolled completely out of viewport
    if (
      triggerRect.bottom < 0 ||
      (window.innerHeight > 0 && triggerRect.top > window.innerHeight)
    ) {
      onClose();
      return;
    }

    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth || width || 192;
    const menuHeight = menuEl?.offsetHeight || 90;

    const vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    const vh = window.innerHeight || document.documentElement.clientHeight || 768;

    // Vertical positioning: default below trigger
    const spaceBelow = vh - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    let top = triggerRect.bottom + 4;
    let placement = 'bottom';

    // Flip upwards if not enough space below, but more space above
    if (spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow) {
      top = Math.max(8, triggerRect.top - menuHeight - 4);
      placement = 'top';
    } else {
      top = Math.min(Math.max(8, top), vh - menuHeight - 8);
    }

    // Horizontal positioning: align with trigger's right edge
    let left = triggerRect.right - menuWidth;
    if (left + menuWidth > vw - 8) {
      left = vw - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
      placement,
    });
  }, [triggerEl, width, onClose]);

  // Recalculate position on open, scroll, resize
  useEffect(() => {
    if (!isOpen || !triggerEl) return;

    calculatePosition();

    const onScroll = () => calculatePosition();
    const onResize = () => calculatePosition();

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, triggerEl, calculatePosition]);

  // Outside click and Escape key listeners
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (triggerEl && triggerEl.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-portal-submenu]')) return;
      if (e.target.closest && e.target.closest('[data-portal-menu]')) return;
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const hasActiveSubmenu = document.querySelector('[data-portal-submenu]');
        if (hasActiveSubmenu) return; // Let submenu handle its own escape first

        e.stopPropagation();
        onClose();
        triggerEl?.focus?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, triggerEl, onClose]);

  if (!isOpen || !triggerEl) return null;

  return createPortal(
    <div
      ref={menuRef}
      data-portal-menu="true"
      role="menu"
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className={`bg-card border border-border-subtle rounded-xl shadow-xl py-1.5 text-left animate-in fade-in zoom-in-95 duration-100 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

ActionPortalMenu.propTypes = {
  triggerEl: PropTypes.any,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  width: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};

/**
 * ActionSubmenuPortal renders an adjacent submenu via React Portal (document.body).
 * Automatically shifts horizontally (left vs right) and vertically (clamping to viewport)
 * to prevent clipping near screen boundaries.
 */
export const ActionSubmenuPortal = ({
  parentTriggerEl,
  isOpen,
  onClose,
  width = 208,
  maxHeight = 224,
  className = '',
  children,
}) => {
  const submenuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const calculatePosition = useCallback(() => {
    if (!parentTriggerEl) return;
    const triggerRect = parentTriggerEl.getBoundingClientRect();

    if (
      triggerRect.bottom < 0 ||
      (window.innerHeight > 0 && triggerRect.top > window.innerHeight)
    ) {
      onClose();
      return;
    }

    const submenuEl = submenuRef.current;
    const subWidth = submenuEl?.offsetWidth || width || 208;
    const subHeight = Math.min(submenuEl?.offsetHeight || maxHeight, maxHeight);

    const vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    const vh = window.innerHeight || document.documentElement.clientHeight || 768;

    // Horizontal: Try opening to the left of the parent menu item first
    const spaceLeft = triggerRect.left;
    const spaceRight = vw - triggerRect.right;

    let left;
    if (spaceLeft >= subWidth + 8) {
      left = triggerRect.left - subWidth - 4;
    } else if (spaceRight >= subWidth + 8) {
      left = triggerRect.right + 4;
    } else {
      left = Math.max(8, vw - subWidth - 8);
    }

    // Vertical: Align with trigger item top, shift upwards if overflowing bottom
    let top = triggerRect.top;
    if (top + subHeight > vh - 8) {
      top = Math.max(8, vh - subHeight - 8);
    }
    if (top < 8) {
      top = 8;
    }

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
    });
  }, [parentTriggerEl, width, maxHeight, onClose]);

  // Recalculate position on open, scroll, resize
  useEffect(() => {
    if (!isOpen || !parentTriggerEl) return;

    calculatePosition();

    const onScroll = () => calculatePosition();
    const onResize = () => calculatePosition();

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, parentTriggerEl, calculatePosition]);

  // Escape key for submenu closes submenu and refocuses parent item
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        parentTriggerEl?.focus?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, parentTriggerEl, onClose]);

  if (!isOpen || !parentTriggerEl) return null;

  return createPortal(
    <div
      ref={submenuRef}
      data-portal-submenu="true"
      role="menu"
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 10000,
        maxHeight: `${maxHeight}px`,
      }}
      className={`bg-card border border-border-subtle rounded-xl shadow-xl py-1.5 overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-100 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

ActionSubmenuPortal.propTypes = {
  parentTriggerEl: PropTypes.any,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  width: PropTypes.number,
  maxHeight: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default ActionPortalMenu;
