import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SprintService from '../api/sprintApi';
import TaskService from '../api/taskApi';
import socketService from '../services/socketService';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export const useSprintDetails = (sprintId, projectId = null) => {
  const queryClient = useQueryClient();

  // Socket room joining for real-time synchronization
  useEffect(() => {
    if (!projectId) return;
    socketService.joinProject(projectId);

    const handleTaskUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint-stats', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint-burndown', sprintId] });
    };

    socketService.onEvent('task_updated', handleTaskUpdate);
    socketService.onEvent('sprint_updated', handleTaskUpdate);

    return () => {
      socketService.leaveProject(projectId);
      socketService.offEvent('task_updated');
      socketService.offEvent('sprint_updated');
    };
  }, [projectId, sprintId, queryClient]);

  // 1. Fetch Sprint Tasks and Project Backlog
  const tasksQuery = useQuery({
    queryKey: ['sprint-tasks', sprintId],
    queryFn: async () => {
      if (!sprintId) return { tasks: [], backlog: [] };
      const res = await SprintService.getSprintTasks(sprintId, {
        includeBacklog: true,
      });
      return res.data?.data || { tasks: [], backlog: [] };
    },
    enabled: !!sprintId,
    staleTime: 15 * 1000,
  });

  // 2. Fetch Sprint Burndown
  const burndownQuery = useQuery({
    queryKey: ['sprint-burndown', sprintId],
    queryFn: async () => {
      if (!sprintId) return null;
      const res = await SprintService.getSprintBurndown(sprintId);
      return res.data?.data || null;
    },
    enabled: !!sprintId,
    staleTime: 60 * 1000,
  });

  // 3. Fetch AI Sprint Planning Suggestions
  const aiPlanQuery = useQuery({
    queryKey: ['sprint-ai-plan', sprintId],
    queryFn: async () => {
      if (!sprintId) return null;
      const res = await SprintService.getAiSprintPlan(sprintId);
      return res.data?.data || null;
    },
    enabled: !!sprintId,
    staleTime: 5 * 60 * 1000,
  });

  // 4. Fetch AI Sprint Health & Risk Insights
  const aiHealthQuery = useQuery({
    queryKey: ['sprint-ai-health', sprintId],
    queryFn: async () => {
      if (!sprintId) return null;
      const res = await SprintService.getAiSprintHealth(sprintId);
      return res.data?.data || null;
    },
    enabled: !!sprintId,
    staleTime: 2 * 60 * 1000,
  });

  // Mutations
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sprints'] });
    queryClient.invalidateQueries({ queryKey: ['sprint-tasks', sprintId] });
    queryClient.invalidateQueries({ queryKey: ['sprint-stats', sprintId] });
    queryClient.invalidateQueries({ queryKey: ['sprint-burndown', sprintId] });
    queryClient.invalidateQueries({ queryKey: ['sprint-ai-plan', sprintId] });
    queryClient.invalidateQueries({ queryKey: ['sprint-ai-health', sprintId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const startSprintMutation = useMutation({
    mutationFn: () => SprintService.startSprint(sprintId),
    onSuccess: () => {
      toast.success('Sprint started successfully');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start sprint');
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: (rolloverData) => SprintService.completeSprint(sprintId, rolloverData),
    onSuccess: (res) => {
      toast.success('Sprint completed successfully');
      invalidateAll();
      return res.data?.data;
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete sprint');
    },
  });

  const addTasksMutation = useMutation({
    mutationFn: (taskIds) => SprintService.addTasksToSprint(sprintId, taskIds),
    onSuccess: () => {
      toast.success('Task(s) added to sprint');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add task to sprint');
    },
  });

  const removeTaskMutation = useMutation({
    mutationFn: (taskId) => SprintService.removeTaskFromSprint(sprintId, taskId),
    onSuccess: () => {
      toast.success('Task moved to product backlog');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to remove task from sprint');
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus, version }) =>
      TaskService.updateTaskStatus(taskId, newStatus, version),
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['sprint-tasks', sprintId] });
      const previous = queryClient.getQueryData(['sprint-tasks', sprintId]);
      queryClient.setQueryData(['sprint-tasks', sprintId], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: (old.tasks || []).map((t) =>
            t._id === taskId ? { ...t, status: newStatus } : t
          ),
        };
      });
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['sprint-tasks', sprintId], ctx.previous);
      }
      toast.error('Failed to update task status');
    },
    onSettled: () => {
      invalidateAll();
    },
  });

  const updateTaskPointsMutation = useMutation({
    mutationFn: ({ taskId, storyPoints }) =>
      TaskService.updateTask(taskId, { storyPoints }),
    onSuccess: () => {
      toast.success('Story points updated');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update story points');
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: (data) => SprintService.updateSprint(sprintId, data),
    onSuccess: () => {
      toast.success('Sprint updated successfully');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update sprint');
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: () => SprintService.deleteSprint(sprintId),
    onSuccess: () => {
      toast.success('Sprint deleted');
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete sprint');
    },
  });

  return {
    tasks: tasksQuery.data?.tasks || [],
    backlog: tasksQuery.data?.backlog || [],
    tasksLoading: tasksQuery.isLoading,
    burndown: burndownQuery.data,
    burndownLoading: burndownQuery.isLoading,
    aiPlan: aiPlanQuery.data,
    aiPlanLoading: aiPlanQuery.isLoading,
    aiHealth: aiHealthQuery.data,
    aiHealthLoading: aiHealthQuery.isLoading,
    startSprint: startSprintMutation.mutateAsync,
    isStarting: startSprintMutation.isPending,
    completeSprint: completeSprintMutation.mutateAsync,
    isCompleting: completeSprintMutation.isPending,
    addTasksToSprint: addTasksMutation.mutateAsync,
    isAddingTasks: addTasksMutation.isPending,
    removeTaskFromSprint: removeTaskMutation.mutateAsync,
    isRemovingTask: removeTaskMutation.isPending,
    updateTaskStatus: updateTaskStatusMutation.mutateAsync,
    updateTaskPoints: updateTaskPointsMutation.mutateAsync,
    updateSprint: updateSprintMutation.mutateAsync,
    isUpdatingSprint: updateSprintMutation.isPending,
    deleteSprint: deleteSprintMutation.mutateAsync,
    isDeletingSprint: deleteSprintMutation.isPending,
    refetchAll: invalidateAll,
  };
};
