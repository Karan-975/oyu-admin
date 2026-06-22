import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsApi } from '../../api/endpoints';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { ArrowLeft, Layers, Plus, Delete, List, CheckSquare } from 'lucide-react';

interface FormFieldDraft {
  label: string;
  fieldKey: string;
  fieldType: string;
  placeholder: string;
  isRequired?: boolean;
}

interface FormField {
  id: string;
  section_id: string;
  label: string;
  field_key: string;
  field_type: string;
  placeholder?: string;
  help_text?: string;
  is_required: number;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  fields: FormField[];
}

interface FormModuleDetail {
  id: string;
  name: string;
  description?: string;
  module_type: string;
  is_multi_step: number;
  sections: FormSection[];
}

const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Number', value: 'number' },
  { label: 'Select / Dropdown', value: 'select' },
  { label: 'Radio Button', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Date Picker', value: 'date' },
  { label: 'GPS Coordinate', value: 'gps' },
  { label: 'Digital Signature', value: 'signature' },
  { label: 'File Upload', value: 'file' },
];

export function FormEditorPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, FormFieldDraft>>({});

  const { data, isLoading, error } = useQuery<{ data: FormModuleDetail }>({
    queryKey: ['form-module', moduleId],
    queryFn: () => formsApi.getModule(moduleId!).then((r) => r.data),
    enabled: Boolean(moduleId),
  });

  const createSection = useMutation({
    mutationFn: (payload: { title: string; description?: string }) => formsApi.addSection(moduleId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-module', moduleId] });
      setSectionTitle('');
      setSectionDescription('');
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: FormFieldDraft }) => formsApi.addField(sectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-module', moduleId] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => formsApi.deleteSection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-module', moduleId] }),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) => formsApi.deleteField(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-module', moduleId] }),
  });

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <EmptyState title="Unable to load module" description="Please try again or select a different form module." icon={<Layers size={40} />} />
    );
  }

  const module = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => navigate('/form-builder')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600">
          <ArrowLeft size={16} /> Back to builder
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{module?.name || 'Form Module'}</h1>
          <p className="text-sm text-slate-500 mt-1">Manage sections and fields for this form.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-700">
            <label className="block font-medium">Module Type</label>
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 bg-slate-50">{module?.module_type || 'custom'}</div>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <label className="block font-medium">Multi-step</label>
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 bg-slate-50">{module?.is_multi_step ? 'Yes' : 'No'}</div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{module?.description || 'No description available.'}</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Add new section</h2>
            <p className="text-sm text-slate-500">Sections group fields and structure the form.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Section title"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <input
            value={sectionDescription}
            onChange={(e) => setSectionDescription(e.target.value)}
            placeholder="Section description"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => createSection.mutate({ title: sectionTitle, description: sectionDescription })}
            disabled={!sectionTitle || createSection.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            <Plus size={16} /> Add Section
          </button>
        </div>
      </div>

      {!module?.sections?.length ? (
        <EmptyState title="No sections yet" description="Create a section to start adding fields." icon={<List size={40} />} />
      ) : (
        <div className="space-y-6">
          {module.sections.map((section: FormSection) => {
            const draft = fieldDrafts[section.id] || { label: '', fieldKey: '', fieldType: 'text', placeholder: '', isRequired: false };
            return (
              <div key={section.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-[0.2em] font-semibold mb-2">
                      <Layers size={14} /> Section
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">{section.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{section.description || 'No description.'}</p>
                  </div>
                  <button
                    onClick={() => deleteSectionMutation.mutate(section.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Delete size={16} /> Delete Section
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {section.fields?.length ? (
                    <div className="grid gap-3">
                      {section.fields.map((field: any) => (
                        <div key={field.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                              <CheckSquare size={14} /> {field.field_type} field
                            </div>
                            <p className="font-semibold text-slate-800">{field.label}</p>
                            <p className="text-sm text-slate-500">Key: {field.field_key} · Required: {field.is_required ? 'Yes' : 'No'}</p>
                          </div>
                          <button
                            onClick={() => deleteFieldMutation.mutate(field.id)}
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >Remove field</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                      No fields in this section yet.
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Add field to section</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={draft.label}
                      onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [section.id]: { ...draft, label: e.target.value } }))}
                      placeholder="Field label"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                    <input
                      value={draft.fieldKey}
                      onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [section.id]: { ...draft, fieldKey: e.target.value } }))}
                      placeholder="Field key"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <select
                      value={draft.fieldType}
                      onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [section.id]: { ...draft, fieldType: e.target.value } }))}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {fieldTypes.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      value={draft.placeholder}
                      onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [section.id]: { ...draft, placeholder: e.target.value } }))}
                      placeholder="Placeholder / instructions"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                    <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.isRequired || false}
                        onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [section.id]: { ...draft, isRequired: e.target.checked } }))}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600"
                      />
                      Required
                    </label>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => {
                        addFieldMutation.mutate({ sectionId: section.id, payload: {
                          label: draft.label,
                          fieldKey: draft.fieldKey || draft.label?.toLowerCase().replace(/\s+/g, '_'),
                          fieldType: draft.fieldType,
                          placeholder: draft.placeholder,
                          isRequired: draft.isRequired,
                        }});
                        setFieldDrafts((prev) => ({ ...prev, [section.id]: { label: '', fieldKey: '', fieldType: 'text', placeholder: '', isRequired: false } }));
                      }}
                      disabled={!draft.label || addFieldMutation.isLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                    >
                      <Plus size={16} /> Add field
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
