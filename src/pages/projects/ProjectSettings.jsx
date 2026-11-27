import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjectManagement } from '../../hooks/useProjectManagement';
import {
  Settings,
  Save,
  ChevronLeft,
  Trash2,
  Shield,
  Rocket,
  Clock,
  Activity,
  Box,
} from 'lucide-react';
import ProjectService from '../../api/projectApi';
import CenteredLoading from '../../components/atoms/CenteredLoading';
import { BackButton } from '../../components/atoms';

/**
 * Tactical Project Settings Interface.
 * Orchestrates mission parameter modification and administrative overrides.
 * Optimized for industrial sunlight legibility and decision-first engineering.
 */
const ProjectSettings = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const { project, isLoading, queryClient } = useProjectManagement(
    id,
    user
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'OPERATIONAL',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'OPERATIONAL',
      });
    }
  }, [project]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await ProjectService.updateProject(id, formData);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    } catch (err) {
      console.error('Linkage update failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <CenteredLoading />;

  return (
    <div className="min-h-screen bg-background text-text p-4 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
        {/* Navigation & Status Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <BackButton />

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs font-semibold text-primary uppercase tracking-wider">
              Project ID: {id.slice(-8).toUpperCase()}
            </span>
            <span className="px-2.5 py-1 bg-status-success/10 border border-status-success/20 rounded-md text-xs font-medium text-status-success uppercase tracking-wider">
              Active
            </span>
          </div>
        </div>

        {/* Title Section */}
        <div className="border-b border-border-subtle pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-card border border-border-subtle rounded-xl flex items-center justify-center text-primary shadow-sm">
              <Settings size={24} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                Project Configuration
              </h1>
              <p className="text-xs sm:text-sm text-text-subtle">
                Manage your project settings and configuration details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-1.5">
            {[
              {
                label: 'General Info',
                icon: <Rocket size={16} />,
                active: true,
              },
              {
                label: 'Access Control',
                icon: <Shield size={16} />,
                to: `/team/project/${id}`,
              },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => item.to && navigate(item.to)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                  item.active
                    ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                    : 'text-text-subtle border-transparent hover:text-text hover:bg-card hover:border-border-subtle'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Main Control Console */}
          <div className="lg:col-span-3 space-y-8">
            <form
              onSubmit={handleSave}
              className="bg-card border border-border-subtle p-6 sm:p-8 rounded-xl shadow-sm space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-subtle uppercase tracking-wider ml-0.5 flex items-center gap-2">
                    <Box size={14} className="text-primary" /> Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full h-11 bg-background-elevated border border-border-subtle px-4 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-subtle uppercase tracking-wider ml-0.5 flex items-center gap-2">
                    <Activity size={14} className="text-primary" /> Project Status
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full h-11 bg-background-elevated border border-border-subtle px-4 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="Active" className="bg-card text-text">
                        Active
                      </option>
                      <option value="On Hold" className="bg-card text-text">
                        On Hold
                      </option>
                      <option value="Completed" className="bg-card text-text">
                        Completed
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-subtle uppercase tracking-wider ml-0.5">
                  Project Description
                </label>
                <textarea
                  rows="5"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-background-elevated border border-border-subtle px-4 py-3 rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-all leading-relaxed"
                ></textarea>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-status-error" />
                <h3 className="text-status-error text-xs font-semibold uppercase tracking-wider">
                  Danger Zone
                </h3>
              </div>

              <div className="bg-status-error/5 border border-status-error/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left space-y-1">
                  <h4 className="text-text font-bold text-sm">
                    Delete Project
                  </h4>
                  <p className="text-text-subtle text-xs leading-relaxed">
                    This action will permanently delete all project data, tasks, and associated records.
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-status-error text-white font-semibold px-6 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
