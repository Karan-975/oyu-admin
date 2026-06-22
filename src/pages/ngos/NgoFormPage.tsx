import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ngosApi, filesApi } from '../../api/endpoints';
import { ArrowLeft, Loader2, Building2, Save, FileText, CheckCircle2, ChevronRight, ChevronLeft, Upload, Plus, Trash2 } from 'lucide-react';
import { PageLoader } from '../../components/ui/PageLoader';
import { cn } from '../../lib/utils';

interface ProjectReference {
  projectName: string;
  location: string;
  scopeOfWork: string;
  year: string;
  beneficiaries: string;
}

interface TeamMember {
  name: string;
  designation: string;
  qualification: string;
  experience: string;
}

interface NgoForm {
  name: string;
  registrationNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  notes: string;
  kycData: {
    yearEstablished: string;
    country: string;
    province: string;
    primaryContactDesignation: string;
    primaryContactMobile: string;
    regCertificateUrl: string;
    taxCertificateUrl: string;
    orgProfileUrl: string;
    panTaxId: string;
    annualReportUrl: string;
    bankDetails: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      ifscCode: string;
    };
    orgChartUrl: string;
    yearsCommunityDev: string;
    projectsCompletedCount: string;
    waterBoreholeProjectsCount: string;
    areasOfExpertise: string[];
    majorDonors: string;
    provincesImplemented: string;
    beneficiariesImpacted: string;
    governmentPartnerships: string;
    fullTimeStaffCount: string;
    fieldStaffCount: string;
    technicalExpertsCount: string;
    boreholeTechniciansCount: string;
    technicalExpertiseList: string[];
    keyTeamMembers: TeamMember[];
    communitiesEngaged: string;
    ruralExperience: string;
    awarenessCampaignsCount: string;
    engagementApproach: string;
    fieldVehiclesCount: string;
    fieldEquipmentTools: string;
    remoteDeploymentAbility: string;
    averageResponseTime: string;
    monitoringReportingSystem: string;
    projectReferences: ProjectReference[];
    signatoryName: string;
    signatoryDesignation: string;
    declarationDate: string;
  };
}

const SECTIONS = [
  { id: 'a', label: 'Organization Profile' },
  { id: 'b', label: 'Legal & Regulatory' },
  { id: 'c', label: 'Experience & Focus' },
  { id: 'd', label: 'Technical Team' },
  { id: 'e', label: 'Community Engagement' },
  { id: 'f', label: 'Operational Capacity' },
  { id: 'g', label: 'Project References' },
  { id: 'h', label: 'Declaration' },
];

export function NgoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState('a');
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const { data: existingNgo, isLoading: loadingNgo } = useQuery({
    queryKey: ['ngo', id],
    queryFn: () => ngosApi.getById(id!).then(r => r.data.data),
    enabled: isEditing,
  });

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, watch } = useForm<NgoForm>({
    defaultValues: {
      name: '',
      registrationNumber: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      notes: '',
      kycData: {
        yearEstablished: '',
        country: 'Nigeria',
        province: '',
        primaryContactDesignation: '',
        primaryContactMobile: '',
        regCertificateUrl: '',
        taxCertificateUrl: '',
        orgProfileUrl: '',
        panTaxId: '',
        annualReportUrl: '',
        bankDetails: {
          bankName: '',
          accountName: '',
          accountNumber: '',
          ifscCode: '',
        },
        orgChartUrl: '',
        yearsCommunityDev: '',
        projectsCompletedCount: '',
        waterBoreholeProjectsCount: '',
        areasOfExpertise: [],
        majorDonors: '',
        provincesImplemented: '',
        beneficiariesImpacted: '',
        governmentPartnerships: '',
        fullTimeStaffCount: '',
        fieldStaffCount: '',
        technicalExpertsCount: '',
        boreholeTechniciansCount: '',
        technicalExpertiseList: [],
        keyTeamMembers: [{ name: '', designation: '', qualification: '', experience: '' }],
        communitiesEngaged: '',
        ruralExperience: '',
        awarenessCampaignsCount: '',
        engagementApproach: '',
        fieldVehiclesCount: '',
        fieldEquipmentTools: '',
        remoteDeploymentAbility: '',
        averageResponseTime: '',
        monitoringReportingSystem: '',
        projectReferences: [
          { projectName: '', location: '', scopeOfWork: '', year: '', beneficiaries: '' },
          { projectName: '', location: '', scopeOfWork: '', year: '', beneficiaries: '' },
          { projectName: '', location: '', scopeOfWork: '', year: '', beneficiaries: '' }
        ],
        signatoryName: '',
        signatoryDesignation: '',
        declarationDate: new Date().toISOString().split('T')[0],
      },
    },
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: 'kycData.keyTeamMembers',
  });

  const { fields: refFields } = useFieldArray({
    control,
    name: 'kycData.projectReferences',
  });

  useEffect(() => {
    if (isEditing && existingNgo) {
      reset({
        name: existingNgo.name,
        registrationNumber: existingNgo.registration_number ?? '',
        contactPerson: existingNgo.contact_person,
        email: existingNgo.email,
        phone: existingNgo.phone,
        address: existingNgo.address,
        website: existingNgo.website ?? '',
        notes: existingNgo.notes ?? '',
        kycData: existingNgo.kyc_data ?? {
          yearEstablished: '',
          country: 'Nigeria',
          province: '',
          primaryContactDesignation: '',
          primaryContactMobile: '',
          regCertificateUrl: '',
          taxCertificateUrl: '',
          orgProfileUrl: '',
          panTaxId: '',
          annualReportUrl: '',
          bankDetails: { bankName: '', accountName: '', accountNumber: '', ifscCode: '' },
          orgChartUrl: '',
          yearsCommunityDev: '',
          projectsCompletedCount: '',
          waterBoreholeProjectsCount: '',
          areasOfExpertise: [],
          majorDonors: '',
          provincesImplemented: '',
          beneficiariesImpacted: '',
          governmentPartnerships: '',
          fullTimeStaffCount: '',
          fieldStaffCount: '',
          technicalExpertsCount: '',
          boreholeTechniciansCount: '',
          technicalExpertiseList: [],
          keyTeamMembers: [{ name: '', designation: '', qualification: '', experience: '' }],
          communitiesEngaged: '',
          ruralExperience: '',
          awarenessCampaignsCount: '',
          engagementApproach: '',
          fieldVehiclesCount: '',
          fieldEquipmentTools: '',
          remoteDeploymentAbility: '',
          averageResponseTime: '',
          monitoringReportingSystem: '',
          projectReferences: [
            { projectName: '', location: '', scopeOfWork: '', year: '', beneficiaries: '' },
            { projectName: '', location: '', scopeOfWork: '', year: '', beneficiaries: '' },
            { projectName: '', location: '', scopeOfWork: '', year: '', beneficiaries: '' }
          ],
          signatoryName: '',
          signatoryDesignation: '',
          declarationDate: new Date().toISOString().split('T')[0],
        },
      });
    }
  }, [existingNgo, isEditing, reset]);

  const mutation = useMutation({
    mutationFn: (data: NgoForm) => isEditing ? ngosApi.update(id!, data) : ngosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      navigate(isEditing ? `/ngos/${id}` : '/ngos');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Something went wrong'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'ngo');
      formData.append('entityId', id || 'new-ngo');

      const res = await filesApi.upload(formData);
      setValue(fieldName, res.data.data.s3Url || res.data.data.url);
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  if (isEditing && loadingNgo) return <PageLoader />;

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentIndex = SECTIONS.findIndex(s => s.id === activeTab);
    if (currentIndex < SECTIONS.length - 1) {
      setActiveTab(SECTIONS[currentIndex + 1].id);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentIndex = SECTIONS.findIndex(s => s.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(SECTIONS[currentIndex - 1].id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
            <Building2 size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit NGO Profile & KYC' : 'Register New NGO (KYC Form)'}</h1>
            <p className="text-xs text-slate-500">Provide registration details, technical capacity, and declarations</p>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {/* Main Layout with Tabs Sidebar & Content Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar Stepper */}
        <div className="space-y-1">
          {SECTIONS.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-xl text-left border text-sm font-semibold transition-all",
                activeTab === section.id
                  ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm shadow-teal-500/5"
                  : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border",
                  activeTab === section.id ? "bg-teal-600 text-white border-teal-600" : "bg-slate-50 text-slate-400 border-slate-200"
                )}>
                  {idx + 1}
                </span>
                {section.label}
              </span>
              <ChevronRight size={14} className={cn("transition-transform", activeTab === section.id ? "translate-x-0.5 text-teal-600" : "text-slate-300")} />
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[500px]">
          
          <div className="p-6 space-y-6">
            
            {/* Section A: Organization Profile */}
            {activeTab === 'a' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> a) Organization Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Organization Name *">
                    <input {...register('name', { required: true })} className="form-input" placeholder="e.g. Water for Life NGO" />
                  </FormField>
                  <FormField label="Registration Number">
                    <input {...register('registrationNumber')} className="form-input" placeholder="e.g. CAC/IT/NO/12345" />
                  </FormField>
                  <FormField label="Year of Establishment">
                    <input {...register('kycData.yearEstablished')} type="number" className="form-input" placeholder="e.g. 2015" />
                  </FormField>
                  <FormField label="Country">
                    <input {...register('kycData.country')} className="form-input" placeholder="Nigeria" />
                  </FormField>
                  <FormField label="Province/Operational Area">
                    <input {...register('kycData.province')} className="form-input" placeholder="e.g. Abuja FCT, Kaduna State" />
                  </FormField>
                  <FormField label="Primary Contact Person *">
                    <input {...register('contactPerson', { required: true })} className="form-input" placeholder="Full Name" />
                  </FormField>
                  <FormField label="Designation of Contact Person">
                    <input {...register('kycData.primaryContactDesignation')} className="form-input" placeholder="e.g. Executive Director" />
                  </FormField>
                  <FormField label="Contact Email *">
                    <input {...register('email', { required: true })} type="email" className="form-input" placeholder="contact@ngo.org" />
                  </FormField>
                  <FormField label="Contact Mobile *">
                    <input {...register('phone', { required: true })} className="form-input" placeholder="e.g. +234 803 123 4567" />
                  </FormField>
                  <FormField label="Alternate Contact Mobile">
                    <input {...register('kycData.primaryContactMobile')} className="form-input" placeholder="Alternate phone" />
                  </FormField>
                </div>
                <FormField label="Registered Address *">
                  <textarea {...register('address', { required: true })} className="form-input min-h-[80px]" placeholder="Full office address" />
                </FormField>
                <FormField label="Website / Social Media URL">
                  <input {...register('website')} className="form-input" placeholder="https://..." />
                </FormField>
              </div>
            )}

            {/* Section B: Legal & Regulatory Details */}
            {activeTab === 'b' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> b) Legal & Regulatory Details (Uploads)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* File Upload Row 1 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">NGO Registration Certificate</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="regCertificate"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'kycData.regCertificateUrl')}
                      />
                      <label htmlFor="regCertificate" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                        <Upload size={14} /> {uploadingField === 'kycData.regCertificateUrl' ? 'Uploading...' : 'Choose File'}
                      </label>
                      {watch('kycData.regCertificateUrl') && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Tax Registration Certificate</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="taxCertificate"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'kycData.taxCertificateUrl')}
                      />
                      <label htmlFor="taxCertificate" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                        <Upload size={14} /> {uploadingField === 'kycData.taxCertificateUrl' ? 'Uploading...' : 'Choose File'}
                      </label>
                      {watch('kycData.taxCertificateUrl') && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* File Upload Row 2 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Organization Profile / Brochure</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="orgProfile"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'kycData.orgProfileUrl')}
                      />
                      <label htmlFor="orgProfile" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                        <Upload size={14} /> {uploadingField === 'kycData.orgProfileUrl' ? 'Uploading...' : 'Choose File'}
                      </label>
                      {watch('kycData.orgProfileUrl') && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>
                      )}
                    </div>
                  </div>

                  <FormField label="PAN / Tax ID Code">
                    <input {...register('kycData.panTaxId')} className="form-input" placeholder="e.g. A9948574F" />
                  </FormField>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Latest Annual Audit Report</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="annualReport"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'kycData.annualReportUrl')}
                      />
                      <label htmlFor="annualReport" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                        <Upload size={14} /> {uploadingField === 'kycData.annualReportUrl' ? 'Uploading...' : 'Choose File'}
                      </label>
                      {watch('kycData.annualReportUrl') && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Organizational Structure (Team Chart)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="orgChart"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'kycData.orgChartUrl')}
                      />
                      <label htmlFor="orgChart" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                        <Upload size={14} /> {uploadingField === 'kycData.orgChartUrl' ? 'Uploading...' : 'Choose File'}
                      </label>
                      {watch('kycData.orgChartUrl') && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank Account Details (For Disbursements)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Bank Name">
                      <input {...register('kycData.bankDetails.bankName')} className="form-input bg-white" placeholder="e.g. Zenith Bank" />
                    </FormField>
                    <FormField label="Account Holder Name">
                      <input {...register('kycData.bankDetails.accountName')} className="form-input bg-white" placeholder="Registered NGO Name" />
                    </FormField>
                    <FormField label="Account Number">
                      <input {...register('kycData.bankDetails.accountNumber')} className="form-input bg-white" placeholder="10-digit number" />
                    </FormField>
                    <FormField label="IFSC / Branch Code">
                      <input {...register('kycData.bankDetails.ifscCode')} className="form-input bg-white" placeholder="e.g. ZENINIB02" />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* Section C: Experience & Focus */}
            {activeTab === 'c' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> c) Experience & Focus Areas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Years in Community Dev">
                    <input {...register('kycData.yearsCommunityDev')} type="number" className="form-input" placeholder="e.g. 10" />
                  </FormField>
                  <FormField label="Total Projects Completed">
                    <input {...register('kycData.projectsCompletedCount')} type="number" className="form-input" placeholder="e.g. 50" />
                  </FormField>
                  <FormField label="Water / Borehole Projects">
                    <input {...register('kycData.waterBoreholeProjectsCount')} type="number" className="form-input" placeholder="e.g. 25" />
                  </FormField>
                </div>

                <FormField label="Provinces / States Where Active">
                  <input {...register('kycData.provincesImplemented')} className="form-input" placeholder="e.g. Kano, FCT, Oyo" />
                </FormField>

                <FormField label="Estimated Total Beneficiaries Impacted">
                  <input {...register('kycData.beneficiariesImpacted')} className="form-input" placeholder="e.g. 100,000+ people" />
                </FormField>

                <FormField label="Major Donors & Development Partners">
                  <textarea {...register('kycData.majorDonors')} className="form-input min-h-[60px]" placeholder="e.g. USAID, UNICEF, WaterAid" />
                </FormField>

                <FormField label="Government Partnership Details">
                  <textarea {...register('kycData.governmentPartnerships')} className="form-input min-h-[60px]" placeholder="MoUs or joint projects with state ministries" />
                </FormField>
              </div>
            )}

            {/* Section D: Technical Team Capacity */}
            {activeTab === 'd' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> d) Technical Team & Capacity
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField label="Full-time Staff">
                    <input {...register('kycData.fullTimeStaffCount')} type="number" className="form-input" placeholder="15" />
                  </FormField>
                  <FormField label="Field Staff">
                    <input {...register('kycData.fieldStaffCount')} type="number" className="form-input" placeholder="8" />
                  </FormField>
                  <FormField label="Technical Experts">
                    <input {...register('kycData.technicalExpertsCount')} type="number" className="form-input" placeholder="4" />
                  </FormField>
                  <FormField label="Dedicated Technicians">
                    <input {...register('kycData.boreholeTechniciansCount')} type="number" className="form-input" placeholder="2" />
                  </FormField>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">Available Technical Expertise (Select all that apply)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Borehole Assessment', 'Pump Installation & Repair', 'Water Quality Testing',
                      'Civil Works (Pads, Drainage)', 'Plumbing & Pipings', 'Solar Power Systems',
                      'Community Surveys', 'GIS & GPS Mapping', 'Data Collection & Reporting'
                    ].map((exp) => (
                      <label key={exp} className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          value={exp}
                          {...register('kycData.technicalExpertiseList')}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        {exp}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Key Team Members Sub-Table */}
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-800">Key Technical Team Members</label>
                    <button
                      type="button"
                      onClick={() => appendTeam({ name: '', designation: '', qualification: '', experience: '' })}
                      className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
                    >
                      <Plus size={14} /> Add Member
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-150 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-150 text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="px-4 py-2 text-left">Full Name</th>
                          <th className="px-4 py-2 text-left">Designation</th>
                          <th className="px-4 py-2 text-left">Qualification</th>
                          <th className="px-4 py-2 text-left">Yrs Experience</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 bg-white">
                        {teamFields.map((field, index) => (
                          <tr key={field.id}>
                            <td className="px-3 py-1.5">
                              <input {...register(`kycData.keyTeamMembers.${index}.name` as const)} className="form-input text-xs py-1" placeholder="e.g. John Doe" />
                            </td>
                            <td className="px-3 py-1.5">
                              <input {...register(`kycData.keyTeamMembers.${index}.designation` as const)} className="form-input text-xs py-1" placeholder="e.g. Hydrogeologist" />
                            </td>
                            <td className="px-3 py-1.5">
                              <input {...register(`kycData.keyTeamMembers.${index}.qualification` as const)} className="form-input text-xs py-1" placeholder="e.g. M.Sc. Geology" />
                            </td>
                            <td className="px-3 py-1.5">
                              <input {...register(`kycData.keyTeamMembers.${index}.experience` as const)} className="form-input text-xs py-1" placeholder="e.g. 5 Years" />
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <button type="button" onClick={() => removeTeam(index)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Section E: Community Engagement */}
            {activeTab === 'e' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> e) Community Engagement Experience
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Communities Currently Engaged">
                    <input {...register('kycData.communitiesEngaged')} className="form-input" placeholder="e.g. 15 rural communities" />
                  </FormField>
                  <FormField label="Number of Hygiene Awareness Campaigns Conducted">
                    <input {...register('kycData.awarenessCampaignsCount')} type="number" className="form-input" placeholder="e.g. 12" />
                  </FormField>
                </div>
                <FormField label="Rural Deployment Experience Description">
                  <textarea {...register('kycData.ruralExperience')} className="form-input min-h-[80px]" placeholder="Brief summary of operations in remote areas" />
                </FormField>
                <FormField label="Community Mobilization & Engagement Approach">
                  <textarea {...register('kycData.engagementApproach')} className="form-input min-h-[85px]" placeholder="How do you secure village cooperation and form committees?" />
                </FormField>
              </div>
            )}

            {/* Section F: Operational Capacity */}
            {activeTab === 'f' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> f) Operational Capacity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Number of Field Vehicles Available">
                    <input {...register('kycData.fieldVehiclesCount')} type="number" className="form-input" placeholder="e.g. 2 Hilux Trucks" />
                  </FormField>
                  <FormField label="Average Response Time for Maintenance Requests">
                    <input {...register('kycData.averageResponseTime')} className="form-input" placeholder="e.g. 48 hours" />
                  </FormField>
                </div>
                <FormField label="Field Equipment & Inspection Tools Owned">
                  <textarea {...register('kycData.fieldEquipmentTools')} className="form-input min-h-[70px]" placeholder="e.g. Water testing kits, GPS units, compressor, etc." />
                </FormField>
                <FormField label="Remote Area Deployment Logistics Ability">
                  <textarea {...register('kycData.remoteDeploymentAbility')} className="form-input min-h-[70px]" placeholder="Describe how staff deploy to remote villages without grid access" />
                </FormField>
                <FormField label="Operational Monitoring & Reporting Tool Used">
                  <textarea {...register('kycData.monitoringReportingSystem')} className="form-input min-h-[70px]" placeholder="e.g. ODK, KoboToolbox, Mobile App, etc." />
                </FormField>
              </div>
            )}

            {/* Section G: Project References */}
            {activeTab === 'g' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> g) Similar Project References (Minimum 3)
                </h3>
                <p className="text-xs text-slate-500">Provide details of three successfully executed water or borehole projects.</p>

                <div className="space-y-6">
                  {refFields.map((field, index) => (
                    <div key={field.id} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-teal-700">Project Reference #{index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField label="Project Name">
                          <input {...register(`kycData.projectReferences.${index}.projectName` as const)} className="form-input bg-white" placeholder="e.g. Community Handpump Rehabilitation" />
                        </FormField>
                        <FormField label="Location">
                          <input {...register(`kycData.projectReferences.${index}.location` as const)} className="form-input bg-white" placeholder="e.g. Taraba State, Nigeria" />
                        </FormField>
                        <FormField label="Year Executed">
                          <input {...register(`kycData.projectReferences.${index}.year` as const)} className="form-input bg-white" placeholder="e.g. 2024" />
                        </FormField>
                        <FormField label="Beneficiaries Impacted">
                          <input {...register(`kycData.projectReferences.${index}.beneficiaries` as const)} className="form-input bg-white" placeholder="e.g. 15,000 villagers" />
                        </FormField>
                      </div>
                      <FormField label="Scope of Work & Deliverables">
                        <textarea {...register(`kycData.projectReferences.${index}.scopeOfWork` as const)} className="form-input bg-white min-h-[60px]" placeholder="e.g. Assessed, desilted, and replaced pump cylinders for 12 solar boreholes" />
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section H: Declaration */}
            {activeTab === 'h' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> h) Declaration & Submission
                </h3>

                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3 text-slate-700">
                  <p className="text-xs font-semibold leading-relaxed">
                    "We hereby declare that all information submitted in this KYC Form is true, complete, and accurate.
                    We acknowledge that any false statement or document upload will lead to immediate cancellation of our NGO registration on the AQWA platform."
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                  <FormField label="Authorized Signatory Name *">
                    <input {...register('kycData.signatoryName', { required: activeTab === 'h' })} className="form-input" placeholder="Full name of representative" />
                  </FormField>
                  <FormField label="Designation of Signatory *">
                    <input {...register('kycData.signatoryDesignation', { required: activeTab === 'h' })} className="form-input" placeholder="e.g. Country Director" />
                  </FormField>
                  <FormField label="Date of Declaration">
                    <input {...register('kycData.declarationDate')} type="date" className="form-input" />
                  </FormField>
                </div>

                <FormField label="Internal Notes (For Office Use Only)">
                  <textarea {...register('notes')} className="form-input min-h-[80px]" placeholder="Write any internal review comments or verification notes..." />
                </FormField>
              </div>
            )}

          </div>

          {/* Stepper Navigation Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeTab === 'a'}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/ngos')}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>

              {activeTab !== 'h' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-all"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-teal-500/20"
                >
                  {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isEditing ? 'Save KYC Details' : 'Submit NGO KYC'}
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
