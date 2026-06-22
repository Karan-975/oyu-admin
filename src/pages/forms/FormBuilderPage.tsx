import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formsApi } from '../../api/endpoints';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Plus, Folder, Square } from 'lucide-react';

interface FormModuleSummary {
  id: string;
  name: string;
  description?: string;
  module_type: string;
  section_count: number;
  field_count: number;
}

interface FormModulePayload {
  name: string;
  slug: string;
  description?: string;
  moduleType: string;
  isMultiStep: boolean;
}

const moduleTypes = [
  { label: 'Custom Form', value: 'custom' },
  { label: 'Borehole Recce', value: 'borehole_recce' },
  { label: 'Baseline Survey', value: 'baseline_survey' },
  { label: 'LSC / Stakeholder Consultation', value: 'lsc_survey' },
  { label: 'Rehabilitation Record', value: 'rehabilitation' },
  { label: 'Monitoring Survey', value: 'monitoring_survey' },
  { label: 'Grievance Form', value: 'grievance' },
];

export function FormBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', moduleType: 'custom', isMultiStep: false });

  const { data, isLoading, error } = useQuery<{ data: FormModuleSummary[] }>({
    queryKey: ['form-modules'],
    queryFn: () => formsApi.listModules().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormModulePayload) => formsApi.createModule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-modules'] });
      setFormData({ name: '', slug: '', description: '', moduleType: 'custom', isMultiStep: false });
      setShowCreate(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Form Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage dynamic form modules, sections, and fields.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md shadow-teal-500/20"
        >
          <Plus size={18} /> {showCreate ? 'Close' : 'New Form Module'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              Module Name
              <input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="e.g. Borehole Recce"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Slug
              <input
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="e.g. borehole_recce"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              Module Type
              <select
                value={formData.moduleType}
                onChange={(e) => setFormData((prev) => ({ ...prev, moduleType: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {moduleTypes.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.isMultiStep}
                onChange={(e) => setFormData((prev) => ({ ...prev, isMultiStep: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Enable multi-step workflow
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-700">
            Description
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              rows={3}
              placeholder="Optional module description"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >Cancel</button>
            <button
              type="button"
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isLoading || !formData.name || !formData.slug}
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isLoading ? 'Saving…' : 'Create Module'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState title="Unable to load form modules" description="Please refresh the page." icon={<Folder size={40} />} />
        ) : !data?.data?.length ? (
          <EmptyState title="No form modules" description="Create your first module to start building forms." icon={<Folder size={40} />} />
        ) : (
          <div className="space-y-4">
            {data.data.map((module: FormModuleSummary) => (
              <div key={module.id} className="rounded-3xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                      <Square size={16} /> {module.module_type || 'custom'}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">{module.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">{module.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Sections: {module.section_count ?? 0}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Fields: {module.field_count ?? 0}</span>
                    <button
                      onClick={() => navigate(`/form-builder/${module.id}`)}
                      className="rounded-full bg-teal-50 px-4 py-2 text-teal-700 hover:bg-teal-100"
                    >Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
