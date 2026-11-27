import React from 'react';
import StatusIndicator from './StatusIndicator';
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Modal dialog for detailed view drilldowns
const DrilldownModal = ({ isOpen, onClose, category, type, data = [] }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border-subtle rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-5 sm:p-6 border-b border-border-subtle flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-text tracking-tight">
              {type === 'role' ? `Analysis: ${category}` : 'Personnel Overview'}
            </h2>
            <nav className="flex items-center gap-1.5 text-xs text-text-subtle">
              <span>Organization</span>
              <span className="opacity-40">/</span>
              <span>{category}</span>
              <span className="opacity-40">/</span>
              <span className="text-text font-medium">
                {type === 'role' ? 'Functional Roles' : 'Personnel'}
              </span>
            </nav>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-text transition-colors p-2 bg-background-elevated border border-border-subtle rounded-md hover:border-border cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-background-elevated z-20">
              <tr className="text-xs font-semibold text-text-subtle border-b border-border-subtle">
                <th className="py-3 px-5 sm:px-6 border-b border-border-subtle">
                  {type === 'role' ? 'Role' : 'Name'}
                </th>
                <th className="py-3 px-5 sm:px-6 border-b border-border-subtle">
                  {type === 'role' ? 'Headcount' : 'Load'}
                </th>
                <th className="py-3 px-5 sm:px-6 border-b border-border-subtle text-center">
                  Utilization
                </th>
                <th className="py-3 px-5 sm:px-6 border-b border-border-subtle">Status</th>
                <th className="py-3 px-5 sm:px-6 border-b border-border-subtle text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {data.length > 0 ? (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-background-elevated/50 transition-colors group"
                  >
                    <td className="py-3 px-5 sm:px-6 font-semibold text-text group-hover:text-primary transition-colors border-b border-border-subtle">
                      {row.role || row.name}
                    </td>
                    <td className="py-3 px-5 sm:px-6 text-text-subtle border-b border-border-subtle">
                      {row.count || row.tasks}
                    </td>
                    <td className="py-3 px-5 sm:px-6 text-center text-text border-b border-border-subtle font-semibold">
                      {row.avgLoad || row.load}%
                    </td>
                    <td className="py-3 px-5 sm:px-6 border-b border-border-subtle">
                      <StatusIndicator color={row.status} showLabel />
                    </td>
                    <td className="py-3 px-5 sm:px-6 border-b border-border-subtle text-right">
                      <button
                        onClick={() => {
                          const target = row.role
                            ? `?role=${row.role}`
                            : `?user=${row.id}`;
                          navigate(`/team${target}`);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border px-2.5 py-1 rounded text-xs font-medium text-text-subtle hover:text-text transition-colors cursor-pointer"
                      >
                        <span>Context</span>
                        <ExternalLink size={11} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="py-16 text-center text-text-subtle text-xs"
                  >
                    No active personnel data identified for this segment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className="py-3 px-6 bg-background-elevated text-xs text-text-subtle text-center border-t border-border-subtle">
          Data synchronized with organization management system
        </footer>
      </div>
    </div>
  );
};

export default DrilldownModal;
