import React from 'react';
import { TASK_STATUS } from '../../constants';

const TaskTable = ({ tasks, onTaskClick, handleStatusChange }) => {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-background-elevated/60">
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Priority
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Ticket ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Title
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Assignee
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Due Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr
                    key={task._id}
                    onClick={() => onTaskClick(task)}
                    className="group hover:bg-background-elevated/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            task.priority?.toUpperCase() === 'URGENT' ||
                            task.priority?.toUpperCase() === 'HIGH'
                              ? 'bg-status-error'
                              : task.priority?.toUpperCase() === 'MEDIUM'
                                ? 'bg-status-warning'
                                : 'bg-status-success'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium capitalize ${
                            ['HIGH', 'URGENT'].includes(
                              task.priority?.toUpperCase()
                            )
                              ? 'text-status-error'
                              : task.priority?.toUpperCase() === 'MEDIUM'
                                ? 'text-status-warning'
                                : 'text-status-success'
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-primary font-mono uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {task.projectKey}-{task.taskNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium capitalize px-2 py-0.5 rounded border ${
                          task.type === 'bug'
                            ? 'bg-status-error/10 border-status-error/30 text-status-error'
                            : task.type === 'epic'
                              ? 'bg-secondary/10 border-secondary/30 text-secondary'
                              : task.type === 'story'
                                ? 'bg-status-success/10 border-status-success/30 text-status-success'
                                : task.type === 'spike'
                                  ? 'bg-primary/10 border-primary/30 text-primary'
                                  : task.type === 'tech_debt'
                                    ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                                    : 'bg-background-elevated border-border-subtle text-text-subtle'
                        }`}
                      >
                        {task.type || 'TASK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-text group-hover:text-primary transition-colors block max-w-[240px] truncate">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className={`text-xs font-medium px-2.5 py-1 rounded-md border appearance-none cursor-pointer focus:outline-none transition-all ${
                          task.status === TASK_STATUS.DONE
                            ? 'bg-status-success/10 border-status-success/30 text-status-success'
                            : task.status === TASK_STATUS.IN_REVIEW
                              ? 'bg-secondary/10 border-secondary/30 text-secondary'
                              : task.status === TASK_STATUS.IN_PROGRESS
                                ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                                : 'bg-background-elevated border-border-subtle text-text'
                        }`}
                      >
                        <option
                          value={TASK_STATUS.TODO}
                          className="bg-card text-text"
                        >
                          To Do
                        </option>
                        <option
                          value={TASK_STATUS.IN_PROGRESS}
                          className="bg-card text-text"
                        >
                          In Progress
                        </option>
                        <option
                          value={TASK_STATUS.IN_REVIEW}
                          className="bg-card text-text"
                        >
                          In Review
                        </option>
                        <option
                          value={TASK_STATUS.DONE}
                          className="bg-card text-text"
                        >
                          Done
                        </option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {task.assignedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                            {task.assignedUser.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-text whitespace-nowrap">
                            {task.assignedUser.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-subtle whitespace-nowrap">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs whitespace-nowrap transition-colors ${
                          task.dueDate &&
                          new Date(task.dueDate) < new Date() &&
                          task.status !== TASK_STATUS.DONE
                            ? 'text-status-error font-semibold'
                            : task.dueDate
                              ? 'text-text-subtle'
                              : 'text-text-subtler'
                        }`}
                      >
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : task.estimatedDuration
                            ? (() => {
                                const mins = task.estimatedDuration || 0;
                                const suggested = new Date(
                                  Date.now() + mins * 60 * 1000
                                );
                                return `~ ${suggested.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                              })()
                            : 'Not set'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-subtle whitespace-nowrap">
                        {task.createdFormatted || 'New'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-16 text-center">
                    <span className="text-xs text-text-subtle">
                      No tasks found
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskTable;
