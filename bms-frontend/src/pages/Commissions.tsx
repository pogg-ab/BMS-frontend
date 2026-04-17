import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Coins, TrendingUp, Wallet, CheckCircle2, History, Filter, Search, XCircle, CreditCard, ArrowRightLeft } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import { getRoles } from '../utils/jwt';

const commissionApi = {
  getRules: () => api.get('/commissions/rules').then(res => res.data),
  createRule: (data: any) => api.post('/commissions/rules', data).then(res => res.data),
  getCommissions: (params: any) => api.get('/commissions', { params }).then(res => res.data),
  getPayments: () => api.get('/commissions/payments').then(res => res.data),
  createPayment: (data: any) => api.post('/commissions/payments', data).then(res => res.data),
  approveCommission: (id: string) => api.put(`/commissions/${id}/approve`).then(res => res.data),
};

const commonApi = {
  getCompanies: () => api.get('/management/companies').then(res => res.data),
  getBuildings: () => api.get('/buildings?per_page=500').then(res => res.data),
};

type Tab = 'dashboard' | 'rules' | 'payments';

export default function Commissions() {
  const toast = useToast();
  const userRoles = getRoles();
  const isSuperAdmin = userRoles.includes('super_admin');
  const isNominee = userRoles.includes('nominee_admin');

  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [rules, setRules] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);

  // Form states
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleData, setRuleData] = useState({
    nominee_id: '',
    building_id: '',
    type: 'PERCENTAGE',
    rate: '',
    basis: 'RENT',
    frequency: 'MONTHLY'
  });

  const [selectedForPayment, setSelectedForPayment] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payRef, setPayRef] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      const [comps, bldgs] = await Promise.all([
        commonApi.getCompanies(),
        commonApi.getBuildings()
      ]);
      setCompanies(comps);
      setBuildings(bldgs.data || bldgs);

      if (tab === 'rules') {
        const r = await commissionApi.getRules();
        setRules(r);
      } else if (tab === 'dashboard') {
        const c = await commissionApi.getCommissions({});
        setCommissions(c);
      } else if (tab === 'payments') {
        const p = await commissionApi.getPayments();
        setPayments(p);
      }
    } catch (err) {
      toast.addToast('Failed to load commission data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await commissionApi.createRule({
        ...ruleData,
        rate: Number(ruleData.rate),
        building_id: ruleData.building_id || undefined
      });
      toast.addToast('Commission rule created', 'success');
      setShowAddRule(false);
      loadData();
    } catch (err) {
      toast.addToast('Failed to create rule', 'error');
    }
  }

  async function handleApprove(id: string) {
    try {
      await commissionApi.approveCommission(id);
      toast.addToast('Commission approved', 'success');
      loadData();
    } catch (err) {
      toast.addToast('Approval failed', 'error');
    }
  }

  async function handleBatchPayment(e: React.FormEvent) {
    e.preventDefault();
    if (selectedForPayment.length === 0) return;
    try {
      await commissionApi.createPayment({
        commission_ids: selectedForPayment,
        reference_no: payRef,
        payment_date: new Date().toISOString().split('T')[0]
      });
      toast.addToast('Commission payment recorded', 'success');
      setShowPaymentModal(false);
      setSelectedForPayment([]);
      setPayRef('');
      loadData();
    } catch (err) {
      toast.addToast('Payment recording failed', 'error');
    }
  }

  const kpis = useMemo(() => {
    const pending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + Number(c.amount), 0);
    const approved = commissions.filter(c => c.status === 'APPROVED').reduce((s, c) => s + Number(c.amount), 0);
    const paid = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + Number(c.amount), 0);
    return { pending, approved, paid };
  }, [commissions]);

  const toggleSelect = (id: string) => {
    setSelectedForPayment(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  function fmtMoney(v: any) {
    return `ETB ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <PageLayout
      title="Commission Management"
      subtitle="Track earnings, approve payouts, and manage operational incentives."
      actions={
        <div className="flex gap-2">
          {tab === 'dashboard' && selectedForPayment.length > 0 && (
            <button onClick={() => setShowPaymentModal(true)} className="button bg-emerald-600 hover:bg-emerald-700">
              <CreditCard size={16} /> Pay Selected ({selectedForPayment.length})
            </button>
          )}
          {isSuperAdmin && tab === 'rules' && (
            <button onClick={() => setShowAddRule(true)} className="button">
              <Plus size={16} /> New Rule
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Pending Payouts" value={fmtMoney(kpis.pending)} subtitle="Calculated but not yet approved" variant="white" icon={<TrendingUp size={18} />} />
          <KPICard title="Approved & Owed" value={fmtMoney(kpis.approved)} subtitle="Ready for final settlement" variant="purple" icon={<Coins size={18} />} />
          <KPICard title="Total Paid" value={fmtMoney(kpis.paid)} subtitle="Historical settled commissions" variant="white" icon={<Wallet size={18} />} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
          {[
            { key: 'dashboard', label: 'Earnings & Approval' },
            { key: 'rules', label: 'Commission Rules' },
            { key: 'payments', label: 'Payment History' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        {tab === 'dashboard' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4 w-10">
                      <input type="checkbox" checked={selectedForPayment.length === commissions.filter(c => c.status === 'APPROVED').length && commissions.length > 0} onChange={() => {}} className="rounded border-slate-300" />
                    </th>
                    <th className="px-6 py-4">Nominee</th>
                    <th className="px-6 py-4">Basis</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {commissions.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-6 py-4">
                        {c.status === 'APPROVED' && <input type="checkbox" checked={selectedForPayment.includes(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-slate-300 text-indigo-600" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{c.nominee?.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{c.building?.name || 'Global'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">{c.source_type}</div>
                        <div className="text-[10px] text-slate-400">Base: {fmtMoney(c.amount_base)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">{fmtMoney(c.amount)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(c.calculated_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.status === 'PENDING' && isSuperAdmin && (
                          <button onClick={() => handleApprove(c.id)} className="text-emerald-500 hover:text-emerald-600 font-bold text-xs uppercase tracking-wider">
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">No commissions recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rules Content */}
        {tab === 'rules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rules.map(rule => (
              <div key={rule.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Coins size={48} />
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600">
                    <ArrowRightLeft size={20} />
                  </div>
                  {!rule.is_active && <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">INACTIVE</span>}
                </div>
                <h4 className="font-bold text-lg">{rule.nominee?.name}</h4>
                <p className="text-xs text-slate-400 mb-4">{rule.building?.name || 'All Buildings'}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rate:</span>
                    <span className="font-bold text-indigo-600">{rule.type === 'PERCENTAGE' ? `${rule.rate}%` : fmtMoney(rule.rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basis:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{rule.basis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="text-slate-500">{rule.frequency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Rule Modal */}
        {showAddRule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg">Define Commission Rule</h3>
                <button onClick={() => setShowAddRule(false)}><XCircle size={20} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateRule} className="p-6 space-y-4">
                <div>
                  <label className="form-label">Nominee Company</label>
                  <select className="form-select" required value={ruleData.nominee_id} onChange={e => setRuleData({...ruleData, nominee_id: e.target.value})}>
                    <option value="">-- Select Company --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Building Scope (Optional)</label>
                  <select className="form-select" value={ruleData.building_id} onChange={e => setRuleData({...ruleData, building_id: e.target.value})}>
                    <option value="">Global Rule</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Basis</label>
                    <select className="form-select" value={ruleData.basis} onChange={e => setRuleData({...ruleData, basis: e.target.value})}>
                      <option value="RENT">Rent Collection</option>
                      <option value="LEASE">Lease Signing</option>
                      <option value="MAINTENANCE">Maintenance Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-select" value={ruleData.type} onChange={e => setRuleData({...ruleData, type: e.target.value})}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed Amount</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">{ruleData.type === 'PERCENTAGE' ? 'Rate (%)' : 'Amount (ETB)'}</label>
                  <input type="number" step="0.01" className="form-input" required value={ruleData.rate} onChange={e => setRuleData({...ruleData, rate: e.target.value})} />
                </div>
                <button type="submit" className="w-full button py-4 text-sm mt-4">Save Rule</button>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg">Process Settlement</h3>
                <button onClick={() => setShowPaymentModal(false)}><XCircle size={20} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleBatchPayment} className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 mb-4">
                  <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Payout</div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {fmtMoney(commissions.filter(c => selectedForPayment.includes(c.id)).reduce((s, c) => s + Number(c.amount), 0))}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">{selectedForPayment.length} line items selected</div>
                </div>
                <div>
                  <label className="form-label">Payment Reference / Batch No.</label>
                  <input className="form-input" required value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. CBE-SETTLE-001" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all mt-4">
                  Confirm Payout
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
