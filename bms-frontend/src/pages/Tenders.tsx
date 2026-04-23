import React, { useEffect, useState } from 'react';
import { Plus, Gavel, Timer, Target, CheckCircle2, XCircle, Search, TrendingUp, UserCheck, Eye, ArrowRight, Building2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import { getRoles } from '../utils/jwt';

const tendersApi = {
  getTenders: (params: any) => api.get('/tenders', { params }).then(res => res.data),
  getTender: (id: string) => api.get(`/tenders/${id}`).then(res => res.data),
  createTender: (data: any) => api.post('/tenders', data).then(res => res.data),
  submitBid: (id: string, data: any) => api.post(`/tenders/${id}/bids`, data).then(res => res.data),
  awardTender: (id: string, bidId: string) => api.put(`/tenders/${id}/award`, { bid_id: bidId }).then(res => res.data),
};

const commonApi = {
  getBuildings: () => api.get('/buildings?per_page=500').then(res => res.data),
  getAllVacantUnits: () => api.get('/units?status=VACANT&per_page=1000').then(res => res.data),
  getUnits: (buildingId: string) => api.get(`/units?building_id=${buildingId}&status=VACANT&per_page=500`).then(res => res.data),
};

export default function Tenders() {
  const toast = useToast();
  const userRoles = getRoles();
  const isSuperAdmin = userRoles.includes('super_admin');
  const isNominee = userRoles.includes('nominee_admin');
  const isTenant = userRoles.includes('tenant');

  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Form states
  const [showAddTender, setShowAddTender] = useState(false);
  const [tenderData, setTenderData] = useState({
    title: '',
    description: '',
    building_id: '',
    unit_id: '',
    minimum_acceptable_bid: '',
    closing_date: ''
  });

  const [showBidModal, setShowBidModal] = useState(false);
  const [bidData, setBidData] = useState({
    proposed_rent: '',
    proposed_start_date: '',
    proposal_details: ''
  });

  useEffect(() => {
    loadData();
    // Load buildings and filter by those that have vacant units
    Promise.all([
      commonApi.getBuildings(),
      commonApi.getAllVacantUnits()
    ]).then(([bRes, uRes]) => {
      const allBuildings = bRes.data || bRes;
      const vacantUnits = uRes.data || uRes;
      
      const buildingIdsWithVacancies = new Set(
        vacantUnits.map((u: any) => u.building_id || u.building?.id)
      );
      
      const filteredBuildings = allBuildings.filter((b: any) => buildingIdsWithVacancies.has(b.id));
      setBuildings(filteredBuildings);
    }).catch(e => console.error("Error loading tender building options", e));
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await tendersApi.getTenders({});
      setTenders(data);
    } catch (err) {
      toast.addToast('Failed to load tenders', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTender(e: React.FormEvent) {
    e.preventDefault();
    try {
      await tendersApi.createTender({
        ...tenderData,
        minimum_acceptable_bid: Number(tenderData.minimum_acceptable_bid),
        status: 'OPEN' // Default to OPEN for now
      });
      toast.addToast('Tender published', 'success');
      setShowAddTender(false);
      loadData();
    } catch (err) {
      toast.addToast('Failed to create tender', 'error');
    }
  }

  async function handleViewTender(id: string) {
    try {
      const data = await tendersApi.getTender(id);
      setSelectedTender(data);
    } catch (err) {
      toast.addToast('Failed to load details', 'error');
    }
  }

  async function handleSubmitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTender) return;
    try {
      await tendersApi.submitBid(selectedTender.id, {
        ...bidData,
        proposed_rent: Number(bidData.proposed_rent)
      });
      toast.addToast('Bid submitted successfully', 'success');
      setShowBidModal(false);
      handleViewTender(selectedTender.id);
    } catch (err: any) {
      toast.addToast(err.response?.data?.message || 'Bid submission failed', 'error');
    }
  }

  async function handleAward(bidId: string) {
    if (!confirm('Award this unit to this bidder? This will automatically create a draft lease.')) return;
    try {
      await tendersApi.awardTender(selectedTender.id, bidId);
      toast.addToast('Tender awarded successfully', 'success');
      handleViewTender(selectedTender.id);
      loadData();
    } catch (err) {
      toast.addToast('Awarding failed', 'error');
    }
  }

  useEffect(() => {
    if (tenderData.building_id) {
      commonApi.getUnits(tenderData.building_id).then(u => setUnits(u.data || u));
    }
  }, [tenderData.building_id]);

  return (
    <PageLayout
      title="Lease Tenders"
      subtitle="Transparent bidding system for premium property leasing."
      actions={
        (isSuperAdmin || isNominee) && (
          <button onClick={() => setShowAddTender(true)} className="button">
            <Plus size={16} /> Open New Tender
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenders.map(t => (
              <div 
                key={t.id} 
                className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border transition-all cursor-pointer group ${selectedTender?.id === t.id ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200'}`}
                onClick={() => handleViewTender(t.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600">
                    <Gavel size={20} />
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{t.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Building2 size={14} /> <span>{t.building?.name} — {t.unit?.unit_number}</span>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Bid</div>
                    <div className="text-lg font-bold text-indigo-600">ETB {Number(t.minimum_acceptable_bid).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closes</div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
                      <Timer size={12} /> {new Date(t.closing_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tenders.length === 0 && (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                No active tenders found.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Selected Detail */}
        <div className="lg:col-span-1">
          {selectedTender ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-6">
              <div className="p-8 bg-indigo-600 text-white">
                <h2 className="text-2xl font-bold mb-2">{selectedTender.title}</h2>
                <p className="text-indigo-100 text-sm">{selectedTender.description}</p>
                {(isTenant || isSuperAdmin || isNominee) && selectedTender.status === 'OPEN' && (
                  <button onClick={() => setShowBidModal(true)} className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all">
                    Submit Proposal
                  </button>
                )}
              </div>

              <div className="p-6">
                <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Current Bids ({selectedTender.bids?.length || 0})</h4>
                <div className="space-y-4">
                  {selectedTender.bids?.map((bid: any) => (
                    <div key={bid.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group/bid">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-indigo-600">ETB {Number(bid.proposed_rent).toLocaleString()}</div>
                        <StatusBadge status={bid.status} />
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{bid.tenant?.name || bid.tenant?.user?.first_name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(bid.submitted_at).toLocaleString()}</div>
                      
                      {(isSuperAdmin || isNominee) && selectedTender.status === 'OPEN' && (
                        <button 
                          onClick={() => handleAward(bid.id)}
                          className="mt-3 w-full py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover/bid:opacity-100 transition-opacity flex items-center justify-center gap-1.5"
                        >
                          <Target size={12} /> Award Tender
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedTender.bids || selectedTender.bids.length === 0) && (
                    <p className="text-center text-sm text-slate-400 py-8">No bids received yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 p-8 text-center">
              <Gavel size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Select a tender for details</p>
              <p className="text-xs mt-1">View bidding history and award operational leases.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Tender Modal */}
      {showAddTender && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg">Create Lease Tender</h3>
              <button onClick={() => setShowAddTender(false)}><XCircle size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTender} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Tender Title</label>
                  <input className="form-input" required value={tenderData.title} onChange={e => setTenderData({...tenderData, title: e.target.value})} placeholder="e.g. Premium Office Space - East Wing" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input min-h-[80px]" value={tenderData.description} onChange={e => setTenderData({...tenderData, description: e.target.value})} placeholder="Details about the unit and requirements..." />
                </div>
                <div>
                  <label className="form-label">Building</label>
                  <select className="form-select" required value={tenderData.building_id} onChange={e => setTenderData({...tenderData, building_id: e.target.value})}>
                    <option value="">-- Select --</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <select className="form-select" required value={tenderData.unit_id} onChange={e => setTenderData({...tenderData, unit_id: e.target.value})}>
                    <option value="">-- Select --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Min Bid (Base Rent)</label>
                  <input type="number" className="form-input" required value={tenderData.minimum_acceptable_bid} onChange={e => setTenderData({...tenderData, minimum_acceptable_bid: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Closing Date</label>
                  <input type="datetime-local" className="form-input" required value={tenderData.closing_date} onChange={e => setTenderData({...tenderData, closing_date: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full button py-4 text-sm mt-4">Publish Tender</button>
            </form>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg">Submit Lease Proposal</h3>
              <button onClick={() => setShowBidModal(false)}><XCircle size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmitBid} className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 mb-4">
                <div className="text-xs font-bold text-indigo-600 uppercase mb-1">Minimum Accepted</div>
                <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400">ETB {Number(selectedTender.minimum_acceptable_bid).toLocaleString()}</div>
              </div>
              <div>
                <label className="form-label">Proposed Monthly Rent</label>
                <input type="number" className="form-input" required value={bidData.proposed_rent} onChange={e => setBidData({...bidData, proposed_rent: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Desired Move-in Date</label>
                <input type="date" className="form-input" required value={bidData.proposed_start_date} onChange={e => setBidData({...bidData, proposed_start_date: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Proposal Details</label>
                <textarea className="form-input min-h-[100px]" value={bidData.proposal_details} onChange={e => setBidData({...bidData, proposal_details: e.target.value})} placeholder="Why should your proposal be accepted? Business type, etc." />
              </div>
              <button type="submit" className="w-full button py-4 text-sm mt-4">Submit Bid</button>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
