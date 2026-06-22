import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi, filesApi, ngosApi } from '../../api/endpoints';
import { ArrowLeft, Loader2, User, Save, FileText, CheckCircle2, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { PageLoader } from '../../components/ui/PageLoader';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth.store';

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  roleIds: string[];
  ngoId?: string | null;
  responsibleNgoAdminId?: string | null;
  kycData: {
    // a) Personal Information
    dob: string;
    gender: string;
    villageWard: string;
    residentialAddress: string;
    passportPhotoUrl: string;
    
    // b) Identity Verification
    idType: string;
    idNumber: string;
    idExpiryDate: string;
    idDocumentUrl: string;

    // c) Address Verification
    addressProofType: string;
    addressProofUrl: string;

    // d) Bank Details
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    cancelledChequeUrl: string;

    // e) Project Engagement Details
    projectRole: string;
    assignedSite: string;
    supervisorName: string;
    joiningDate: string;
    accessibleModules: string[];

    // f) Compliance & Declarations
    agreedToCodeOfConduct: boolean;
    agreedToDataPrivacy: boolean;
    agreedToSafeguarding: boolean;

    // g) Emergency Contact
    emergencyName: string;
    emergencyRelation: string;
    emergencyPhone: string;
    emergencyAddress: string;

    // h) Declaration by Applicant + Signature
    applicantDeclarationName: string;
    declarationDate: string;
    signatureUrl: string;

    // i) For Office Use Only
    kycStatus: 'Pending KYC' | 'Awaiting Document Verification' | 'Approved' | 'Rejected';
    reviewedBy: string;
    approvedBy: string;
    officeSignatureUrl: string;
    officeRemarks: string;
  };
}

const SECTIONS = [
  { id: 'a', label: 'Personal Information' },
  { id: 'b', label: 'Identity Verification' },
  { id: 'c', label: 'Address Verification' },
  { id: 'd', label: 'Bank Details' },
  { id: 'e', label: 'Project Engagement' },
  { id: 'f', label: 'Compliance & Declarations' },
  { id: 'g', label: 'Emergency Contact' },
  { id: 'h', label: 'Applicant Declaration' },
  { id: 'i', label: 'Office Use Only' },
];

export function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isEditing = !!id;
  
  const [activeTab, setActiveTab] = useState('a');
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.roles?.includes('super_admin');
  const isNgoAdmin = currentUser?.roles?.includes('ngo_admin');

  const { data: existingUser, isLoading: loadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!).then(r => r.data),
    enabled: isEditing,
  });

  const isEditingSuperAdmin = isEditing && existingUser?.roleSlugs?.includes('super_admin');

  const visibleSections = SECTIONS.filter(s => {
    if (isEditingSuperAdmin) {
      return s.id === 'a' || s.id === 'e';
    }
    return true;
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list().then(r => r.data.data),
  });

  const { data: ngoAdminsData } = useQuery({
    queryKey: ['users', 'ngo-admins-for-form'],
    queryFn: () => usersApi.list({ limit: 100, roleSlug: 'ngo_admin', status: 'active' }).then(r => r.data.data),
    enabled: isSuperAdmin,
  });

  const { data: ngosData } = useQuery({
    queryKey: ['ngos-for-user-form'],
    queryFn: () => ngosApi.list({ limit: 100 }).then(r => r.data.data),
    enabled: isSuperAdmin,
  });

  const assignableRoles = rolesData?.filter((role: any) => role.slug !== 'contractor') ?? [];
  const ngoAdmins = ngoAdminsData ?? [];
  const ngos = ngosData ?? [];

  const { register, handleSubmit, reset, setValue, watch } = useForm<UserForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      roleIds: [],
      ngoId: null,
      responsibleNgoAdminId: '',
      kycData: {
        dob: '',
        gender: '',
        villageWard: '',
        residentialAddress: '',
        passportPhotoUrl: '',
        idType: 'National ID',
        idNumber: '',
        idExpiryDate: '',
        idDocumentUrl: '',
        addressProofType: 'Utility Bill',
        addressProofUrl: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        cancelledChequeUrl: '',
        projectRole: '',
        assignedSite: '',
        supervisorName: '',
        joiningDate: '',
        accessibleModules: [],
        agreedToCodeOfConduct: false,
        agreedToDataPrivacy: false,
        agreedToSafeguarding: false,
        emergencyName: '',
        emergencyRelation: '',
        emergencyPhone: '',
        emergencyAddress: '',
        applicantDeclarationName: '',
        declarationDate: new Date().toISOString().split('T')[0],
        signatureUrl: '',
        kycStatus: 'Pending KYC',
        reviewedBy: '',
        approvedBy: '',
        officeSignatureUrl: '',
        officeRemarks: '',
      },
    },
  });

  const selectedRoleIds = watch('roleIds') ?? [];
  const selectedRoleSlugs = assignableRoles
    .filter((role: any) => selectedRoleIds.includes(role.id))
    .map((role: any) => role.slug);
  const requiresResponsibleAdminSelection = isSuperAdmin && selectedRoleSlugs.includes('ngo_team_member');

  useEffect(() => {
    if (isEditing && existingUser) {
      reset({
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
        email: existingUser.email,
        phone: existingUser.phone || '',
        roleIds: existingUser.roleIds || [],
        ngoId: existingUser.ngo_id,
        responsibleNgoAdminId: existingUser.created_by || '',
        kycData: existingUser.kycData ?? {
          dob: '',
          gender: '',
          villageWard: '',
          residentialAddress: '',
          passportPhotoUrl: '',
          idType: 'National ID',
          idNumber: '',
          idExpiryDate: '',
          idDocumentUrl: '',
          addressProofType: 'Utility Bill',
          addressProofUrl: '',
          bankName: '',
          accountName: '',
          accountNumber: '',
          ifscCode: '',
          cancelledChequeUrl: '',
          projectRole: '',
          assignedSite: '',
          supervisorName: '',
          joiningDate: '',
          accessibleModules: [],
          agreedToCodeOfConduct: false,
          agreedToDataPrivacy: false,
          agreedToSafeguarding: false,
          emergencyName: '',
          emergencyRelation: '',
          emergencyPhone: '',
          emergencyAddress: '',
          applicantDeclarationName: '',
          declarationDate: new Date().toISOString().split('T')[0],
          signatureUrl: '',
          kycStatus: 'Pending KYC',
          reviewedBy: '',
          approvedBy: '',
          officeSignatureUrl: '',
          officeRemarks: '',
        },
      });
    }
  }, [existingUser, isEditing, reset]);

  const mutation = useMutation({
    mutationFn: (data: UserForm) => {
      // NGO Admin setting default roles
      if (isNgoAdmin && !data.roleIds.length) {
        const teamMemberRole = assignableRoles.find((r: any) => r.slug === 'ngo_team_member');
        if (teamMemberRole) {
          data.roleIds = [teamMemberRole.id];
        }
      }

      // If password is blank on edit, remove it
      const payload: any = { ...data };
      if (isEditing && !payload.password) {
        delete payload.password;
      }
      if (isNgoAdmin) {
        // The API derives team ownership and NGO scope from the logged-in admin.
        delete payload.ngoId;
        delete payload.responsibleNgoAdminId;
      } else {
        if (!payload.ngoId) delete payload.ngoId;
        if (!payload.responsibleNgoAdminId) delete payload.responsibleNgoAdminId;
      }
      return isEditing ? usersApi.update(id!, payload) : usersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/settings/users');
    },
    onError: (err: any) => {
      const validationErrors = err?.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors
            .map((item: any) => `${item.field || 'Field'}: ${item.message}`)
            .join(' ')
        : '';
      setError(validationMessage || err?.response?.data?.message || 'Failed to save user KYC profile');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'user');
      formData.append('entityId', id || 'new-user');

      const res = await filesApi.upload(formData);
      setValue(fieldName, res.data.data.s3Url || res.data.data.url);
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentIndex = visibleSections.findIndex(s => s.id === activeTab);
    if (currentIndex < visibleSections.length - 1) {
      setActiveTab(visibleSections[currentIndex + 1].id);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentIndex = visibleSections.findIndex(s => s.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(visibleSections[currentIndex - 1].id);
    }
  };

  const toggleRole = (roleId: string) => {
    const nextRoleIds = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter(rid => rid !== roleId)
      : [...selectedRoleIds, roleId];
    setValue('roleIds', nextRoleIds);
  };

  const toggleModule = (moduleSlug: string) => {
    const currentModules = watch('kycData.accessibleModules') || [];
    const nextModules = currentModules.includes(moduleSlug)
      ? currentModules.filter(m => m !== moduleSlug)
      : [...currentModules, moduleSlug];
    setValue('kycData.accessibleModules', nextModules);
  };

  if (isEditing && loadingUser) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/settings/users')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
            <User size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit User KYC Profile' : 'Register New User (KYC Form)'}</h1>
            <p className="text-xs text-slate-500">Provide personal details, bank verification, compliance, and permissions</p>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Stepper Sidebar */}
        <div className="space-y-1">
          {visibleSections.map((section, idx) => (
            <button
              key={section.id}
              type="button"
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
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[520px]">
          
          <div className="p-6 space-y-6">
            
            {/* Section A: Personal Information */}
            {activeTab === 'a' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> a) Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">First Name *</label>
                    <input {...register('firstName', { required: true })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="First Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Last Name *</label>
                    <input {...register('lastName', { required: true })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Last Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Email Address *</label>
                    <input {...register('email', { required: true })} type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="email@domain.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Phone / Mobile Number *</label>
                    <input {...register('phone', { required: true })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="+234..." />
                  </div>
                  {!isEditing && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Account Password *</label>
                      <input {...register('password', { required: !isEditing })} type="password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Create password" />
                    </div>
                  )}
                  {isEditing && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">New Password (leave blank to keep current)</label>
                      <input {...register('password')} type="password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="New Password" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Date of Birth</label>
                    <input {...register('kycData.dob')} type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Gender</label>
                    <select {...register('kycData.gender')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Village / Ward</label>
                    <input {...register('kycData.villageWard')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Assigned community village" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Residential Address</label>
                    <textarea {...register('kycData.residentialAddress')} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Full home address" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Passport Size Photograph</label>
                    <div className="mt-1 flex items-center gap-4">
                      {watch('kycData.passportPhotoUrl') && (
                        <img src={watch('kycData.passportPhotoUrl')} alt="Passport" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                        <Upload size={14} />
                        {uploadingField === 'kycData.passportPhotoUrl' ? 'Uploading...' : 'Upload Passport Photo'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'kycData.passportPhotoUrl')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section B: Identity Verification */}
            {activeTab === 'b' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> b) Identity Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Government ID Type</label>
                    <select {...register('kycData.idType')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                      <option value="National ID">National ID Card</option>
                      <option value="Drivers License">Driver's License</option>
                      <option value="International Passport">International Passport</option>
                      <option value="Voters Card">Voter's Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">ID Number / Reference Number</label>
                    <input {...register('kycData.idNumber')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Enter ID number" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Expiry Date</label>
                    <input {...register('kycData.idExpiryDate')} type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Upload ID Document (PDF or Image)</label>
                    <div className="mt-1 flex items-center gap-4">
                      {watch('kycData.idDocumentUrl') && (
                        <a href={watch('kycData.idDocumentUrl')} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline">View Uploaded ID</a>
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                        <Upload size={14} />
                        {uploadingField === 'kycData.idDocumentUrl' ? 'Uploading...' : 'Upload ID Document'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'kycData.idDocumentUrl')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section C: Address Verification */}
            {activeTab === 'c' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> c) Address Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Proof of Address Document Type</label>
                    <select {...register('kycData.addressProofType')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                      <option value="Utility Bill">Utility Bill (Water/Electric)</option>
                      <option value="Tenancy Agreement">Tenancy Agreement</option>
                      <option value="Bank Statement">Bank Statement</option>
                      <option value="LGA Letter">LGA Certificate of Residence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Upload Proof of Address Document</label>
                    <div className="mt-1 flex items-center gap-4">
                      {watch('kycData.addressProofUrl') && (
                        <a href={watch('kycData.addressProofUrl')} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline">View Uploaded Proof</a>
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                        <Upload size={14} />
                        {uploadingField === 'kycData.addressProofUrl' ? 'Uploading...' : 'Upload Document'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'kycData.addressProofUrl')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section D: Bank Details */}
            {activeTab === 'd' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> d) Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Bank Name</label>
                    <input {...register('kycData.bankName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="e.g. Access Bank" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Account Holder Name</label>
                    <input {...register('kycData.accountName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Full name on account" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Account Number</label>
                    <input {...register('kycData.accountNumber')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="10-digit Account number" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">IFSC / Sort Code</label>
                    <input {...register('kycData.ifscCode')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Sort Code / SWIFT" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Upload Cancelled Cheque or Bank Statement Summary</label>
                    <div className="mt-1 flex items-center gap-4">
                      {watch('kycData.cancelledChequeUrl') && (
                        <a href={watch('kycData.cancelledChequeUrl')} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline">View Document</a>
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                        <Upload size={14} />
                        {uploadingField === 'kycData.cancelledChequeUrl' ? 'Uploading...' : 'Upload Document'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'kycData.cancelledChequeUrl')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section E: Project Engagement Details */}
            {activeTab === 'e' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> e) Project Engagement Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Project Engagement Role</label>
                    <input {...register('kycData.projectRole')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="e.g. Field Engineer, Comm Lead" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Assigned Site / Village</label>
                    <input {...register('kycData.assignedSite')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Primary site" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Supervisor Name</label>
                    <input {...register('kycData.supervisorName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Direct supervisor" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Joining Date</label>
                    <input {...register('kycData.joiningDate')} type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                  </div>

                  {isSuperAdmin && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Assign Platform User Roles *</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {assignableRoles.map((role: any) => (
                          <label key={role.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-lg hover:bg-slate-100 border border-slate-100">
                            <input
                              type="checkbox"
                              checked={selectedRoleIds.includes(role.id)}
                              onChange={() => toggleRole(role.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <div>
                              <span className="text-sm font-semibold text-slate-700 block">{role.name}</span>
                              <span className="text-[10px] text-slate-400 block">{role.description}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSuperAdmin && !selectedRoleSlugs.includes('super_admin') && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Assign NGO / Organization *</label>
                      <select
                        {...register('ngoId')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="">Select NGO</option>
                        {ngos.map((ngo: any) => (
                          <option key={ngo.id} value={ngo.id}>
                            {ngo.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Select the organization this user belongs to.</p>
                    </div>
                  )}

                  {isSuperAdmin && requiresResponsibleAdminSelection && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Responsible NGO Admin *</label>
                      <select
                        {...register('responsibleNgoAdminId')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="">Select responsible NGO Admin</option>
                        {ngoAdmins.map((admin: any) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.first_name} {admin.last_name} ({admin.email})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">This specifies who will monitor this team member's progress.</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Permitted / Accessible App Modules</label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {['Recce', 'Baseline', 'Rehabilitation', 'Monitoring', 'Water Testing'].map((moduleSlug) => {
                        const accessible = watch('kycData.accessibleModules') || [];
                        const checked = accessible.includes(moduleSlug);
                        return (
                          <button
                            key={moduleSlug}
                            type="button"
                            onClick={() => toggleModule(moduleSlug)}
                            className={cn(
                              "px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all",
                              checked
                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {moduleSlug}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section F: Compliance & Declarations */}
            {activeTab === 'f' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> f) Compliance & Declarations
                </h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-100 cursor-pointer">
                    <input type="checkbox" {...register('kycData.agreedToCodeOfConduct')} className="mt-1 rounded border-slate-300" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Code of Conduct Agreement</p>
                      <p className="text-xs text-slate-400 mt-0.5">I agree to adhere to OYU Green's project standard guidelines and ethical operations.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-100 cursor-pointer">
                    <input type="checkbox" {...register('kycData.agreedToDataPrivacy')} className="mt-1 rounded border-slate-300" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Data Privacy & Security Consent</p>
                      <p className="text-xs text-slate-400 mt-0.5">I consent to secure processing of spatial data, field assessments, and photos under GDPR standards.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-100 cursor-pointer">
                    <input type="checkbox" {...register('kycData.agreedToSafeguarding')} className="mt-1 rounded border-slate-300" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Child Protection & Safeguarding Policy</p>
                      <p className="text-xs text-slate-400 mt-0.5">I confirm that I understand and will uphold child safety and gender equality protocols in fields.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Section G: Emergency Contact */}
            {activeTab === 'g' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> g) Emergency Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Contact Full Name</label>
                    <input {...register('kycData.emergencyName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Full Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Relationship</label>
                    <input {...register('kycData.emergencyRelation')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="e.g. Spouse, Parent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Contact Mobile Number</label>
                    <input {...register('kycData.emergencyPhone')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="+234..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Contact Address</label>
                    <textarea {...register('kycData.emergencyAddress')} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Physical Address" />
                  </div>
                </div>
              </div>
            )}

            {/* Section H: Declaration by Applicant */}
            {activeTab === 'h' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> h) Declaration by Applicant
                </h3>
                <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl text-xs text-slate-600 leading-relaxed space-y-2">
                  <p className="font-semibold text-yellow-800 font-sans">APPLICANT DECLARATION SUMMARY:</p>
                  <p>
                    I hereby declare that all the information furnished above in this KYC application form is true, correct, and complete to the best of my knowledge and belief. I undertake to inform OYU Green of any changes therein, immediately. In case any of the information is found to be false or misleading, I am aware that I may be held liable for it.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Applicant Declaration Name</label>
                    <input {...register('kycData.applicantDeclarationName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Full name of applicant" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Declaration Date</label>
                    <input {...register('kycData.declarationDate')} type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Digital Signature Upload (PNG signature file)</label>
                    <div className="mt-1 flex items-center gap-4">
                      {watch('kycData.signatureUrl') && (
                        <img src={watch('kycData.signatureUrl')} alt="Signature" className="w-40 h-16 rounded border object-contain bg-white" />
                      )}
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                        <Upload size={14} />
                        {uploadingField === 'kycData.signatureUrl' ? 'Uploading...' : 'Upload Signature'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'kycData.signatureUrl')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section I: For Office Use Only */}
            {activeTab === 'i' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} /> i) For Office Use Only
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">KYC Verification Status</label>
                    <select 
                      {...register('kycData.kycStatus')} 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      disabled={!isSuperAdmin && !isNgoAdmin}
                    >
                      <option value="Pending KYC">Pending KYC</option>
                      <option value="Awaiting Document Verification">Awaiting Document Verification</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Reviewed By</label>
                    <input 
                      {...register('kycData.reviewedBy')} 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" 
                      placeholder="Officer Name"
                      disabled={!isSuperAdmin && !isNgoAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Approved By</label>
                    <input 
                      {...register('kycData.approvedBy')} 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" 
                      placeholder="Approver Name"
                      disabled={!isSuperAdmin && !isNgoAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Office Remarks / Reason for Rejection</label>
                    <input 
                      {...register('kycData.officeRemarks')} 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" 
                      placeholder="Notes or reasons"
                      disabled={!isSuperAdmin && !isNgoAdmin}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Office Signature / Rubber Stamp (Upload)</label>
                    <div className="mt-1 flex items-center gap-4">
                      {watch('kycData.officeSignatureUrl') && (
                        <img src={watch('kycData.officeSignatureUrl')} alt="Office Signature" className="w-40 h-16 rounded border object-contain bg-white" />
                      )}
                      {(isSuperAdmin || isNgoAdmin) && (
                        <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                          <Upload size={14} />
                          {uploadingField === 'kycData.officeSignatureUrl' ? 'Uploading...' : 'Upload Office Stamp/Sig'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'kycData.officeSignatureUrl')} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Stepper Navigation Actions footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeTab === 'a'}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeTab === 'i'}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/settings/users')}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-5 py-2 text-xs font-semibold text-white gradient-primary rounded-lg hover:opacity-90 shadow-md shadow-teal-500/10 flex items-center gap-1.5 transition-all"
              >
                {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isEditing ? 'Save KYC Changes' : 'Register & Save KYC'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
