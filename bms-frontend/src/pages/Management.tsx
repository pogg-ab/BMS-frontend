import React, { useEffect, useState } from 'react';
import { Plus, Shield, Building2, MapPin, Trash2, CheckCircle2, XCircle, Search, Settings as SettingsIcon } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import KPICard from '../components/KPICard';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';

const managementApi = {
  getCompanies: () => api.get('/management/companies').then(res => res.data),
  createCompany: (data: any) => api.post('/management/companies', data).then(res => res.data),
  getAssignments: (companyId: string) => api.get(`/management/assignments?company_id=${companyId}`).then(res => res.data),
  createAssignment: (data: any) => api.post('/management/assignments', data).then(res => res.data),
  deleteAssignment: (id: string) => api.delete(`/management/assignments/${id}`).then(res => res.data),
};

const commonApi = {
  getBuildings: () => api.get('/buildings?per_page=500').then(res => res.data),
  getUnits: (buildingId: string) => api.get(`/units?building_id=${buildingId}&per_page=500`).then(res => res.data),
};

export default function Management() {
  const toast = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Form states
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    tin_number: '',
    company_type: '',
    address: '',
    city: '',
    phone_primary: '',
    phone_secondary: '',
    email_business: '',
    email_support: '',
    website: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    logo_url: ''
  });

  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [asBuildingId, setAsBuildingId] = useState('');
  const [asUnitId, setAsUnitId] = useState('');
  const [asScope, setAsScope] = useState<'BUILDING' | 'UNIT'>('BUILDING');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [comps, bldgs] = await Promise.all([
        managementApi.getCompanies(),
        commonApi.getBuildings()
      ]);
      setCompanies(comps);
      setBuildings(bldgs.data || bldgs);
    } catch (err) {
      toast.addToast('Failed to load management data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    try {
      await managementApi.createCompany(formData);
      toast.addToast('Company registered successfully', 'success');
      setShowAddCompany(false);
      setFormData({
        name: '', registration_number: '', tin_number: '', company_type: '',
        address: '', city: '', phone_primary: '', phone_secondary: '',
        email_business: '', email_support: '', website: '',
        bank_name: '', bank_account_number: '', bank_account_name: '', logo_url: ''
      });
      loadData();
    } catch (err) {
      toast.addToast('Failed to register company', 'error');
    }
  }

  async function handleSelectCompany(comp: any) {
    setSelectedCompany(comp);
    setAssignments([]);
    try {
      const data = await managementApi.getAssignments(comp.id);
      setAssignments(data);
    } catch (err) {
      toast.addToast('Failed to load assignments', 'error');
    }
  }

  async function handleAddAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      await managementApi.createAssignment({
        company_id: selectedCompany.id,
        building_id: asBuildingId,
        unit_id: asScope === 'UNIT' ? asUnitId : undefined,
        scope_type: asScope
      });
      toast.addToast('Assignment added', 'success');
      setShowAddAssignment(false);
      handleSelectCompany(selectedCompany);
    } catch (err) {
      toast.addToast('Failed to add assignment', 'error');
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm('Delete this assignment?')) return;
    try {
      await managementApi.deleteAssignment(id);
      toast.addToast('Assignment removed', 'success');
      handleSelectCompany(selectedCompany);
    } catch (err) {
      toast.addToast('Failed to remove assignment', 'error');
    }
  }

  useEffect(() => {
    if (asBuildingId) {
      commonApi.getUnits(asBuildingId).then(data => setUnits(data.data || data));
    } else {
      setUnits([]);
    }
  }, [asBuildingId]);

  return (
    <PageLayout
      title="Management & Delegation"
      subtitle="Manage third-party companies and building operations."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={() => setShowAddCompany(true)} className="button shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
            <Plus size={16} /> <span className="hidden xs:inline">Add Company</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Companies List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Shield size={18} className="text-indigo-500" />
                Management Companies
              </h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {companies.map(comp => (
                <div 
                  key={comp.id}
                  onClick={() => handleSelectCompany(comp)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${selectedCompany?.id === comp.id ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-l-4 border-indigo-500' : ''}`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white">{comp.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{comp.registration_number || comp.tin_number || 'No ID'}</span>
                    <span className="text-[10px] text-indigo-500 font-bold">{comp.city}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{comp.email_business}</div>
                </div>
              ))}
              {companies.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">No companies registered.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assignments Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCompany ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                      <Shield size={24} className="text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">{selectedCompany.company_type || 'Management Company'}</div>
                      <h2 className="text-xl sm:text-3xl font-bold leading-tight">{selectedCompany.name}</h2>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 pt-8 border-t border-white/10">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tax / Reg</div>
                      <div className="text-xs sm:text-sm font-medium text-slate-300">TIN: {selectedCompany.tin_number || 'N/A'}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Reg: {selectedCompany.registration_number || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact</div>
                      <div className="text-xs sm:text-sm font-medium text-slate-300 truncate">{selectedCompany.phone_primary || 'N/A'}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{selectedCompany.email_business || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</div>
                      <div className="text-xs sm:text-sm font-medium text-slate-300">{selectedCompany.city || 'N/A'}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{selectedCompany.address || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Banking</div>
                      <div className="text-xs sm:text-sm font-medium text-slate-300 truncate">{selectedCompany.bank_name || 'N/A'}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">A/C: {selectedCompany.bank_account_number || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                  <Building2 size={200} />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-base sm:text-lg">Operating Scope</h3>
                <button onClick={() => setShowAddAssignment(true)} className="button-secondary text-xs sm:text-sm py-1.5 px-3">
                  <Plus size={14} /> <span className="hidden xs:inline">New Assignment</span>
                  <span className="xs:hidden">Assign</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Scope</th>
                      <th className="px-6 py-4">Building</th>
                      <th className="px-6 py-4">Unit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {assignments.map(as => (
                      <tr key={as.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${as.scope_type === 'BUILDING' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {as.scope_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{as.building?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{as.unit?.unit_number || 'All Units'}</td>
                        <td className="px-6 py-4">
                          {as.is_active ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                              <CheckCircle2 size={14} /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                              <XCircle size={14} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteAssignment(as.id)} className="text-slate-400 hover:text-rose-500 p-2">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No active assignments for this company.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              <Shield size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">Select a company to manage assignments</p>
              <p className="text-sm mt-1">Assign buildings or units to delegate management operations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg">Register Management Company</h3>
                <p className="text-xs text-slate-500">Provide complete legal and banking details for the nominee.</p>
              </div>
              <button onClick={() => setShowAddCompany(false)}><XCircle size={20} className="text-slate-400 hover:text-rose-500 transition-colors" /></button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="p-8 overflow-y-auto space-y-8">
              {/* Legal & Identification */}
              <section>
                <h4 className="text-sm font-bold text-indigo-500 mb-4 flex items-center gap-2">
                  <Shield size={16} /> Legal & Identification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Company Name <span className="text-red-500">*</span></label>
                    <input className="input-field w-full" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Commercial Nominees PLC" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Company Type</label>
                    <select className="input-field w-full" value={formData.company_type} onChange={e => setFormData({...formData, company_type: e.target.value})}>
                      <option value="">Select Type</option>
                      <option value="PLC">PLC</option>
                      <option value="Share Company">Share Company</option>
                      <option value="LLC">LLC</option>
                      <option value="Partnership">Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Reg. Number</label>
                    <input className="input-field w-full" value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} placeholder="e.g. BUS/2026/001" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">TIN Number</label>
                    <input className="input-field w-full" value={formData.tin_number} onChange={e => setFormData({...formData, tin_number: e.target.value})} placeholder="10-digit TIN" />
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h4 className="text-sm font-bold text-indigo-500 mb-4 flex items-center gap-2">
                  <MapPin size={16} /> Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Physical Address</label>
                    <textarea className="input-field w-full h-20 pt-3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full office address..." />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">City</label>
                    <input className="input-field w-full" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="e.g. Addis Ababa" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Website</label>
                    <input className="input-field w-full" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Primary Phone</label>
                    <input className="input-field w-full" value={formData.phone_primary} onChange={e => setFormData({...formData, phone_primary: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Business Email</label>
                    <input type="email" className="input-field w-full" value={formData.email_business} onChange={e => setFormData({...formData, email_business: e.target.value})} />
                  </div>
                </div>
              </section>

              {/* Banking Details */}
              <section>
                <h4 className="text-sm font-bold text-indigo-500 mb-4 flex items-center gap-2">
                  <Plus size={16} /> Banking Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Bank Name</label>
                    <input className="input-field w-full" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Account Name</label>
                    <input className="input-field w-full" value={formData.bank_account_name} onChange={e => setFormData({...formData, bank_account_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Account Number</label>
                    <input className="input-field w-full" value={formData.bank_account_number} onChange={e => setFormData({...formData, bank_account_number: e.target.value})} />
                  </div>
                </div>
              </section>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowAddCompany(false)} className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                  Register Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal Placeholder */}
      {showAddAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg">Assign Operational Scope</h3>
              <button onClick={() => setShowAddAssignment(false)}><XCircle size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddAssignment} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Scope Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setAsScope('BUILDING')} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${asScope === 'BUILDING' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>Building Level</button>
                  <button type="button" onClick={() => setAsScope('UNIT')} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${asScope === 'UNIT' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>Unit Level</button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Select Building <span className="text-red-500">*</span></label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required value={asBuildingId} onChange={e => setAsBuildingId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {asScope === 'UNIT' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Select Unit <span className="text-red-500">*</span></label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required value={asUnitId} onChange={e => setAsUnitId(e.target.value)}>
                    <option value="">-- Select --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all mt-4">
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
