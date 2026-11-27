import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import TaskCard from './TaskCard';

// Kanban task board component with mobile-first collapsible columns.
const TaskBoard = ({
  groupedTasks,
  totalGroupedTasks,
  user,
  columns,
  handleStatusChange,
  onTaskClick,
  cardLayout,
}) => {
  // Mobile accordion state:
  // By default, columns with tasks are expanded; empty columns are collapsed on mobile.
  const [collapsedColumns, setCollapsedColumns] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      const taskCount = (groupedTasks[col.id] || []).length;
      initial[col.id] = taskCount === 0;
    });
    return initial;
  });

  // Re-sync collapsed state when groupedTasks changes (e.g. filter/sprint switch)
  useEffect(() => {
    setCollapsedColumns((prev) => {
      const updated = { ...prev };
      columns.forEach((col) => {
        const taskCount = (groupedTasks[col.id] || []).length;
        // If a previously empty column now has tasks, automatically expand it
        if (taskCount > 0 && updated[col.id] === true) {
          updated[col.id] = false;
        }
      });
      return updated;
    });
  }, [groupedTasks, columns]);

  const toggleColumn = (columnId) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  return (
    <div className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle items-stretch">
        {columns.map((column) => {
          const columnTasks = groupedTasks[column.id] || [];
          const totalColumnTasks = totalGroupedTasks
            ? totalGroupedTasks[column.id] || []
            : columnTasks;
          const isCollapsed = !!collapsedColumns[column.id];

          return (
            <div
              key={column.id}
              className="flex-1 min-w-0 sm:min-w-[240px] flex flex-col h-full bg-card"
            >
              {/* Column Header - Clickable accordion on mobile (<640px) */}
              <button
                type="button"
                onClick={() => toggleColumn(column.id)}
                className="w-full px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40 sticky top-0 z-20 text-left cursor-pointer sm:cursor-default transition-colors hover:bg-background-elevated/60 sm:hover:bg-background-elevated/40"
                aria-expanded={!isCollapsed}
                aria-label={`${column.title} column, ${totalColumnTasks.length} tasks`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${column.color.replace('text-', 'bg-').split(' ')[0]}`}
                  />
                  <h3 className="text-xs sm:text-sm font-semibold text-text truncate">
                    {column.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-background-elevated border border-border-subtle rounded text-xs font-mono font-medium text-text-subtle">
                    {totalColumnTasks.length.toString().padStart(2, '0')}
                  </span>
                  {/* Chevron icon indicator for mobile */}
                  <ChevronDown
                    size={14}
                    className={`text-text-subtle sm:hidden transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                  />
                </div>
              </button>

              {/* Column Body - Collapsible on mobile, always visible on sm+ */}
              <div
                className={`${isCollapsed ? 'hidden sm:block' : 'block'
                  } p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 flex-grow min-h-0 lg:min-h-[420px] max-h-none lg:max-h-[720px] lg:overflow-y-auto scrollbar-thin`}
              >
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      user={user}
                      columns={columns}
                      handleStatusChange={handleStatusChange}
                      onTaskClick={onTaskClick}
                      cardLayout={cardLayout}
                    />
                  ))
                ) : (
                  <div className="py-4 sm:py-8 lg:py-12 flex flex-col items-center justify-center text-center text-text-subtle min-h-[64px] sm:min-h-[120px] lg:min-h-[160px]">
                    <span className="text-xs font-medium text-text-subtle/70">
                      No tasks found
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

TaskBoard.propTypes = {
  groupedTasks: PropTypes.object.isRequired,
  totalGroupedTasks: PropTypes.object,
  user: PropTypes.object,
  columns: PropTypes.array.isRequired,
  handleStatusChange: PropTypes.func.isRequired,
  onTaskClick: PropTypes.func.isRequired,
  cardLayout: PropTypes.string,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
};

export default TaskBoard;
