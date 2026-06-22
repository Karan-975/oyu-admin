import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterTestingApi, filesApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import {
  ArrowLeft, FlaskConical, Upload, CheckCircle, Save, FileText, AlertTriangle, Check, X,
  MapPin, Calendar, User, Compass, Droplet, ShieldAlert, Award
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WaterTestingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenNotes, setReopenNotes] = useState('');

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['water-testing-detail', id],
    queryFn: () => waterTestingApi.getById(id!).then((r) => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ fileUrl }: { fileUrl: string }) => waterTestingApi.uploadReport(id!, fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-testing-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['water-testing'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => waterTestingApi.publish(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-testing-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['water-testing'] });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (notes: string) => waterTestingApi.reopen(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-testing-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['water-testing'] });
      setShowReopenModal(false);
      setReopenNotes('');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'water_testing');
      formData.append('entityId', id!);

      const res = await filesApi.upload(formData);
      const fileUrl = res.data.data.s3Url || res.data.data.url;
      
      await uploadMutation.mutateAsync({ fileUrl });
    } catch (err) {
      console.error('Report upload failed', err);
      alert('Upload failed. Please try a valid PDF document.');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error || !record) {
    return (
      <EmptyState
        title="Water test record not found"
        description="The record may have been deleted or doesn't exist."
        icon={<FlaskConical size={40} />}
      />
    );
  }

  // Threshold alerts
  const checkPh = (val?: number) => val && (val < 6.5 || val > 8.5);
  const checkTurbidity = (val?: number) => val && val > 5;
  const checkTds = (val?: number) => val && val > 500;
  const checkFluoride = (val?: number) => val && val > 1.5;
  const checkIron = (val?: number) => val && val > 0.3;

  const getAlertClass = (isAlert: boolean) =>
    isAlert ? "text-rose-600 bg-rose-50 border-rose-200" : "text-emerald-700 bg-emerald-50 border-emerald-100";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">Water Test Details</h1>
              <StatusBadge status={record.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Test request ID: {record.id.toUpperCase()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {record.status === 'report_uploaded' && (
            <>
              <button
                onClick={() => setShowReopenModal(true)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 transition-all cursor-pointer"
              >
                Reopen Submission
              </button>
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-1.5 px-5 py-2 gradient-primary hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                {publishMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Publish Results
              </button>
            </>
          )}
          {record.status === 'published' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 rounded-lg">
              <Award size={14} /> Report Published
            </span>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata & Report Upload */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Droplet className="text-teal-600" size={16} /> Borehole & Sample Collection Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase">Borehole</span>
                <p className="font-semibold text-slate-700">{record.borehole_name}</p>
                <p className="text-xs text-slate-400 font-mono">{record.borehole_code}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase">Location</span>
                <p className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-slate-400" /> {record.village}, {record.district}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase">Submitted By</span>
                <p className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                  <User size={12} className="text-slate-400" /> {record.submitted_by_name}
                </p>
                <p className="text-xs text-slate-400">{record.submitted_by_email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase">Sample Date</span>
                <p className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} className="text-slate-400" /> {new Date(record.submission_date).toLocaleString()}
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase">GPS Coordinates</span>
                <p className="font-mono text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 bg-slate-50 px-2 py-1 rounded w-max border border-slate-100">
                  <Compass size={12} className="text-slate-400 animate-spin-slow" />
                  Latitude: {record.b_lat}, Longitude: {record.b_lng}
                </p>
              </div>
            </div>
          </div>

          {/* Report Attachment / PDF Section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <FileText className="text-teal-600" size={16} /> Laboratory Report Attachment (PDF)
            </h3>

            {record.report_file_url ? (
              <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold shrink-0 border border-teal-100">
                    PDF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 truncate max-w-[240px]">water_quality_report_{record.borehole_code}.pdf</p>
                    <p className="text-[10px] text-slate-400">Uploaded {new Date(record.report_uploaded_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={record.report_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-all cursor-pointer"
                  >
                    Open Report
                  </a>
                  {record.status !== 'published' && (
                    <div className="relative">
                      <input
                        type="file"
                        id="replace-report"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="replace-report"
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer block text-center transition-all"
                      >
                        Replace
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Upload Lab Test PDF Report</p>
                  <p className="text-xs text-slate-400 mt-1">Upload the laboratory certified PDF report to parse the parameters.</p>
                </div>
                <div>
                  <input
                    type="file"
                    id="upload-report"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="upload-report"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-md shadow-teal-500/10 cursor-pointer transition-all"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Select Lab PDF
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Parameters Grid */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FlaskConical className="text-teal-600" size={16} /> Chemical/Biological parameters
              </h3>
            </div>

            {record.status === 'submitted' ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <ShieldAlert size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-medium">Awaiting Laboratory Report</p>
                <p className="text-xs text-slate-300">Upload the PDF report first to extract parameters automatically.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Extracted Parameters</div>
                
                <ParameterRow label="pH Level" value={record.param_ph} unit="" isAlert={!!checkPh(record.param_ph)} standard="6.5 - 8.5" />
                <ParameterRow label="Electrical Conductivity" value={record.param_ec} unit="µS/cm" isAlert={false} standard="< 1000" />
                <ParameterRow label="Total Dissolved Solids" value={record.param_tds} unit="mg/L" isAlert={!!checkTds(record.param_tds)} standard="< 500" />
                <ParameterRow label="Turbidity" value={record.param_turbidity} unit="NTU" isAlert={!!checkTurbidity(record.param_turbidity)} standard="< 5.0" />
                <ParameterRow label="Temperature" value={record.param_temperature} unit="°C" isAlert={false} standard="—" />
                <ParameterRow label="Total Hardness" value={record.param_hardness} unit="mg/L" isAlert={false} standard="< 300" />
                <ParameterRow label="Chlorine Content" value={record.param_chlorine} unit="mg/L" isAlert={false} standard="< 0.5" />
                <ParameterRow label="Fluoride Content" value={record.param_fluoride} unit="mg/L" isAlert={!!checkFluoride(record.param_fluoride)} standard="< 1.5" />
                <ParameterRow label="Iron Content" value={record.param_iron} unit="mg/L" isAlert={!!checkIron(record.param_iron)} standard="< 0.3" />

                {(checkPh(record.param_ph) || checkTurbidity(record.param_turbidity) || checkTds(record.param_tds) || checkFluoride(record.param_fluoride) || checkIron(record.param_iron)) && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-rose-800 text-[11px] leading-relaxed font-semibold">
                    <AlertTriangle size={14} className="shrink-0 text-rose-500 mt-0.5" />
                    <span>Warning: One or more parameters exceed permissible standards. Inspect the borehole's rehabilitation records.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {record.review_notes && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Remarks</h3>
              <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">{record.review_notes}</p>
              {record.reviewer_name && (
                <p className="text-[10px] text-slate-400 text-right">Remarks by: {record.reviewer_name}</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Reopen Notes Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-150 shadow-2xl p-6 max-w-md w-full space-y-4 animate-scale-in">
            <div>
              <h3 className="text-base font-bold text-slate-800">Reopen Water Test Submission</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please provide remarks/reasons why this lab report is rejected or needs corrections.</p>
            </div>
            <textarea
              className="form-input min-h-[100px] text-sm"
              placeholder="e.g. PDF quality is blurred or incorrect parameters entered..."
              value={reopenNotes}
              onChange={(e) => setReopenNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => { setShowReopenModal(false); setReopenNotes(''); }}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => reopenMutation.mutate(reopenNotes)}
                disabled={!reopenNotes.trim() || reopenMutation.isPending}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md shadow-teal-500/10 cursor-pointer"
              >
                {reopenMutation.isPending ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ParameterRow({ label, value, unit, isAlert, standard }: { label: string; value?: number; unit: string; isAlert: boolean; standard: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/20 text-xs">
      <div className="space-y-0.5">
        <span className="font-semibold text-slate-700">{label}</span>
        {standard && <p className="text-[10px] text-slate-400">Standard: {standard}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <span className="font-bold text-slate-800 text-sm">
          {value !== null && value !== undefined ? `${value.toFixed(2)} ${unit}` : '—'}
        </span>
        {value !== null && value !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border",
            isAlert ? "text-rose-700 bg-rose-50 border-rose-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"
          )}>
            {isAlert ? <X size={10} /> : <Check size={10} />}
            {isAlert ? 'High' : 'Normal'}
          </span>
        )}
      </div>
    </div>
  );
}
