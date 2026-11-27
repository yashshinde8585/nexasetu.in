import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import socketService from '../services/socketService';
import ProjectService from '../api/projectApi';
import TaskService from '../api/taskApi';
import SprintService from '../api/sprintApi';
import AiService from '../api/aiApi';
import GithubService from '../api/githubApi';
import { TASK_STATUS, USER_ROLES } from '../constants';
import MetricsService from '../api/metricsApi';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

// Manages state, mutations, and derived data for individual project environments.
export const useProjectManagement = (id) => {
  const { user, authReady } = useAuth();
  const queryClient = useQueryClient();

  // Real-time Synchronizer: Manages project room lifecycle and event-driven cache invalidation
  useEffect(() => {
    if (!id || id === 'null') return;

    // Join the tactical project frequency
    socketService.joinProject(id);

    // Synchronize local cache with remote changes
    const handleTaskUpdate = (payload) => {
      console.debug('[SOCKET] Task update received, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
    };

    const handleAgentActivity = (activity) => {
      console.debug('[SOCKET] Agent activity detected:', activity.type);
      // Optional: Update activity log or show pulse animation
    };

    socketService.onEvent('task_updated', handleTaskUpdate);
    socketService.onEvent('AGENT_ACTIVITY', handleAgentActivity);

    // Teardown: Prevent zombie subscriptions and memory leaks
    return () => {
      socketService.leaveProject(id);
      socketService.offEvent('task_updated');
      socketService.offEvent('AGENT_ACTIVITY');
    };
  }, [id, queryClient]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [showGithubPanel, setShowGithubPanel] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    sprint: '',
    priority: 'medium',
    type: 'task',
    estimatedDuration: 30,
    durationUnit: 'minutes',
    dueDate: '',
    startDate: '',
    attachments: [],
  });
  const [githubToken, setGithubToken] = useState('');
  const [githubSuggestions, setGithubSuggestions] = useState([]);
  const [githubConnected, setGithubConnected] = useState(false);

  const [selectedSprintId, setSelectedSprintId] = useState(null);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () =>
      ProjectService.getProject(id).then((res) => res.data?.project),
    enabled: authReady && !!id && id !== 'null',
    staleTime: 10 * 60 * 1000, // 10 min — project metadata is slow-moving
    gcTime: 30 * 60 * 1000,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', id, selectedSprintId],
    queryFn: () =>
      TaskService.getTasksByProject(id, selectedSprintId).then(
        (res) => res.data?.tasks
      ),
    enabled: authReady && !!id && id !== 'null',
    staleTime: 30 * 1000, // 30 s — socket invalidations keep this fresh in real-time
    gcTime: 5 * 60 * 1000,
  });

  const analyticsQuery = useQuery({
    queryKey: ['analytics', id, selectedSprintId],
    queryFn: () =>
      ProjectService.getProjectAnalytics(id, selectedSprintId).then(
        (res) => res.data?.analytics
      ),
    enabled: authReady && !!id && id !== 'null',
    staleTime: 5 * 60 * 1000, // 5 min — analytics are computed snapshots
    gcTime: 15 * 60 * 1000,
  });

  const sprintsQuery = useQuery({
    queryKey: ['sprints', user?.workspaceId],
    queryFn: () =>
      SprintService.getSprints().then((res) => res.data?.sprints || []),
    enabled: authReady && !!user?.workspaceId,
    staleTime: 10 * 60 * 1000, // 10 min — shared with useDashboard, same key reuses cache
    gcTime: 30 * 60 * 1000,
  });

  const reposQuery = useQuery({
    queryKey: ['github-repos'],
    queryFn: () =>
      GithubService.getRepositories().then(
        (res) => res.data?.repositories || []
      ),
    enabled: authReady && githubConnected,
    retry: false,
    onError: () => setGithubConnected(false),
    staleTime: 60 * 60 * 1000, // 1 hour — GitHub repo list changes very rarely
    gcTime: 60 * 60 * 1000,
  });

  const directivesQuery = useQuery({
    queryKey: ['directives', id],
    queryFn: () =>
      ProjectService.getActiveDirectives(id).then(
        (res) => res.data?.directives || []
      ),
    enabled: authReady && !!id,
    staleTime: 10 * 60 * 1000, // 10 min — directives are project-level config, rarely mutated
    gcTime: 30 * 60 * 1000,
  });

  const createTaskMutation = useMutation({
    mutationFn: (task) => {
      const currentSprintId =
        task.sprint ||
        selectedSprintId ||
        projectQuery.data?.sprint?._id ||
        projectQuery.data?.sprint;
      const payload = { ...task, project: id, sprint: currentSprintId };

      // Convert to minutes based on unit for estimatedDuration calculation,
      // but keep the unit for persistence
      if (task.durationUnit === 'hours') {
        payload.estimatedDuration = (task.estimatedDuration || 0) * 60;
      } else if (task.durationUnit === 'days') {
        payload.estimatedDuration = (task.estimatedDuration || 0) * 1440; // 24 * 60
      }

      return TaskService.createTask(payload);
    },
    onMutate: async (newTaskData) => {
      // Optimized Path: Provide instant feedback for task creation
      const queryKey = ['tasks', id, selectedSprintId];
      await queryClient.cancelQueries({ queryKey });

      const previousTasks = queryClient.getQueryData(queryKey);

      const optimisticTask = {
        ...newTaskData,
        _id: `temp-${Date.now()}`,
        status: newTaskData.status || TASK_STATUS.TODO,
        createdAt: new Date().toISOString(),
        assignedUser: user, // Optimistically assume assigned to self or data provided
        isOptimistic: true,
      };

      queryClient.setQueryData(queryKey, (old) => [
        optimisticTask,
        ...(old || []),
      ]);

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['tasks', id, selectedSprintId],
          context.previousTasks
        );
      }
      toast.error(
        err?.response?.data?.message || 'Could not create task. Please try again.'
      );
    },
    onSuccess: (res) => {
      const createdTask = res.data?.task || res.task;
      MetricsService.trackTaskCreated(createdTask?._id, createdTask?.title);
      toast.success(
        createdTask?.title
          ? `Created task: ${createdTask.title}`
          : 'Task created successfully.'
      );

      setShowTaskForm(false);
      setAiSuggestion(null);
      setNewTask({
        title: '',
        description: '',
        status: TASK_STATUS.TODO,
        sprint: '',
        priority: 'medium',
        estimatedDuration: 30,
        durationUnit: 'minutes',
        dueDate: '',
        startDate: '',
        attachments: [],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', id, selectedSprintId],
      });
      queryClient.invalidateQueries({
        queryKey: ['analytics', id, selectedSprintId],
      });
      queryClient.invalidateQueries({ queryKey: ['sprint-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status, version }) => {
      const task = tasksQuery.data?.find((t) => t._id === taskId);
      const taskVersion =
        version !== undefined
          ? version
          : task?.__v !== undefined
          ? task.__v
          : task?.version;
      return TaskService.updateTaskStatus(taskId, status, taskVersion);
    },
    onMutate: async ({ taskId, status }) => {
      const queryKey = ['tasks', id, selectedSprintId];
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old?.map((t) => (t._id === taskId ? { ...t, status } : t))
      );
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['tasks', id, selectedSprintId],
          context.previousTasks
        );
      }
      toast.error(
        err?.response?.data?.message || 'Failed to update task status. Restoring previous state.'
      );
    },
    onSuccess: (_, variables) => {
      const statusLabels = {
        [TASK_STATUS.TODO]: 'To Do',
        [TASK_STATUS.IN_PROGRESS]: 'In Progress',
        [TASK_STATUS.IN_REVIEW]: 'In Review',
        [TASK_STATUS.DONE]: 'Done',
      };
      const label = statusLabels[variables.status] || variables.status;
      toast.success(`Task moved to ${label}.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', id, selectedSprintId],
      });
      queryClient.invalidateQueries({
        queryKey: ['analytics', id, selectedSprintId],
      });
      queryClient.invalidateQueries({ queryKey: ['sprint-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const aiExtractMutation = useMutation({
    mutationFn: (text) => AiService.extractTaskFromText(text),
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Failed to generate task details. Please verify your prompt and try again.'
      );
    },
    onSuccess: (res) => {
      const suggestion = res.data?.suggestion;
      if (!suggestion) {
        toast.error('No task details could be extracted from the provided text.');
        return;
      }
      toast.success('Task details generated. Review and adjust below.');

      if (projectQuery.data?.sprint) {
        suggestion.sprint =
          projectQuery.data.sprint._id || projectQuery.data.sprint;
      }

      // Improve UX: Convert minutes to most appropriate unit for display
      let mins = suggestion.estimatedDuration || 30;
      if (mins >= 1440 && mins % 1440 === 0) {
        suggestion.estimatedDuration = mins / 1440;
        suggestion.durationUnit = 'days';
      } else if (mins >= 60 && mins % 60 === 0) {
        suggestion.estimatedDuration = mins / 60;
        suggestion.durationUnit = 'hours';
      } else {
        suggestion.durationUnit = 'minutes';
      }

      setAiSuggestion(suggestion);
      setAiInput('');
    },
  });

  const githubConnectMutation = useMutation({
    mutationFn: (token) => GithubService.connectGithub(token),
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Failed to connect GitHub account. Check token permissions.'
      );
    },
    onSuccess: () => {
      setGithubConnected(true);
      setGithubToken('');
      toast.success('GitHub account connected successfully.');
      queryClient.invalidateQueries(['github-repos']);
    },
  });

  const githubLinkRepoMutation = useMutation({
    mutationFn: (repo) =>
      GithubService.linkProject(id, {
        owner: repo.owner,
        repo: repo.name,
        fullName: repo.fullName,
      }),
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Failed to link repository to project.'
      );
    },
    onSuccess: () => {
      toast.success('Repository linked to project.');
      queryClient.invalidateQueries(['project', id]);
    },
  });

  const githubActivityMutation = useMutation({
    mutationFn: () => GithubService.getActivitySuggestions(id),
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Could not fetch GitHub activity.'
      );
    },
    onSuccess: (res) => {
      const suggestions = res.data?.suggestions || [];
      setGithubSuggestions(suggestions);
      if (suggestions.length === 0) {
        toast('No new GitHub commits or PRs found since last sync.', {
          icon: 'ℹ️',
        });
      } else {
        toast.success(`Found ${suggestions.length} task updates from GitHub.`);
      }
    },
  });

  const githubApproveMutation = useMutation({
    mutationFn: (tasks) => GithubService.approveTasks(id, tasks),
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Failed to approve GitHub task updates.'
      );
    },
    onSuccess: (_, approvedTasks) => {
      toast.success(
        `Approved ${approvedTasks?.length || 1} task update${approvedTasks?.length === 1 ? '' : 's'}.`
      );
      setGithubSuggestions((prev) =>
        prev.filter(
          (s) => !approvedTasks.some((at) => at.githubId === s.githubId)
        )
      );
      queryClient.invalidateQueries(['tasks', id]);
      queryClient.invalidateQueries(['analytics', id]);
      queryClient.invalidateQueries(['sprint-stats']);
      queryClient.invalidateQueries(['dashboard-stats']);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => ProjectService.updateProject(id, data),
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Failed to update project settings.'
      );
    },
    onSuccess: () => {
      toast.success('Project updated successfully.');
      queryClient.invalidateQueries(['project', id]);
      queryClient.invalidateQueries(['sprint-stats']);
      queryClient.invalidateQueries(['dashboard-stats']);
    },
  });

  const groupedTasks = useMemo(() => {
    const visibleTasks = tasksQuery.data || [];

    return {
      [TASK_STATUS.TODO]: visibleTasks.filter(
        (t) => t.status === TASK_STATUS.TODO
      ),
      [TASK_STATUS.IN_PROGRESS]: visibleTasks.filter(
        (t) => t.status === TASK_STATUS.IN_PROGRESS
      ),
      [TASK_STATUS.IN_REVIEW]: visibleTasks.filter(
        (t) => t.status === TASK_STATUS.IN_REVIEW
      ),
      [TASK_STATUS.DONE]: visibleTasks.filter(
        (t) => t.status === TASK_STATUS.DONE
      ),
    };
  }, [tasksQuery.data, user]);

  return {
    project: projectQuery.data,
    tasks: tasksQuery.data,
    analytics: analyticsQuery.data,
    directives: directivesQuery.data || [],
    isLoading:
      projectQuery.isLoading ||
      tasksQuery.isLoading ||
      sprintsQuery.isLoading ||
      directivesQuery.isLoading,
    error:
      projectQuery.error ||
      tasksQuery.error ||
      sprintsQuery.error ||
      createTaskMutation.error ||
      aiExtractMutation.error,
    selectedSprintId,
    setSelectedSprintId,

    ui: {
      showTaskForm,
      setShowTaskForm,
      showAiInput,
      setShowAiInput,
      showGithubPanel,
      setShowGithubPanel,
    },

    statusMutation,
    createTaskMutation,
    updateProjectMutation,
    groupedTasks,
    sprints: useMemo(() => {
      const allSprints = sprintsQuery.data || [];
      return allSprints.filter((s) => {
        const pid = s.project?._id || s.project;
        return !pid || pid === id;
      });
    }, [sprintsQuery.data, id]),

    ai: {
      input: aiInput,
      setInput: setAiInput,
      processing: aiExtractMutation.isPending,
      suggestion: aiSuggestion,
      setSuggestion: setAiSuggestion,
      extract: () => aiExtractMutation.mutate(aiInput),
    },

    github: {
      token: githubToken,
      setToken: setGithubToken,
      connected: githubConnected,
      setConnected: setGithubConnected,
      repos: reposQuery.data || [],
      loadingRepos: reposQuery.isLoading,
      suggestions: githubSuggestions,
      setSuggestions: setGithubSuggestions,
      isFetchingActivity: githubActivityMutation.isPending,
      connect: () => githubConnectMutation.mutate(githubToken),
      linkRepo: (repo) => githubLinkRepoMutation.mutate(repo),
      fetchRepos: () => reposQuery.refetch(),
      syncActivity: () => githubActivityMutation.mutate(),
      approveTasks: (tasks) => githubApproveMutation.mutate(tasks),
    },

    setNewTask,
    newTask,
    queryClient,
  };
};
