import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { IoArrowBackOutline, IoDocumentTextOutline, IoSearchOutline } from 'react-icons/io5';

export function AdminAuditLogPage() {
  const navigate = useNavigate();
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterEntity, setFilterEntity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const logsQ = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => (await api.get('/admin/audit-log')).data
  });

  const rawLogs = logsQ.data?.logs || [];

  // Categorization Data
  const categories = useMemo(() => {
    const actions = new Set<string>();
    const entities = new Set<string>();
    rawLogs.forEach((l: any) => {
      actions.add(l.action);
      entities.add(l.entity);
    });
    return {
      actions: Array.from(actions).sort(),
      entities: Array.from(entities).sort()
    };
  }, [rawLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return rawLogs.filter((l: any) => {
      const matchAction = filterAction === 'ALL' || l.action === filterAction;
      const matchEntity = filterEntity === 'ALL' || l.entity === filterEntity;
      const matchSearch = !searchQuery || 
        l.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(l.after || {}).toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.action.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAction && matchEntity && matchSearch;
    });
  }, [rawLogs, filterAction, filterEntity, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-6 font-medium transition-colors">
          <span className="text-xl"><IoArrowBackOutline /></span><span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2"><IoDocumentTextOutline className="text-blue-500" /> System Audit Logs</h1>
            <p className="text-gray-600">Track all administrative actions and system changes</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
            <span className="text-green-700 font-bold">{filteredLogs.length}</span>
            <span className="text-green-600 text-sm">Logs Found</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Filter by Action</label>
            <select 
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            >
              <option value="ALL">All Actions</option>
              {categories.actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Filter by Entity</label>
            <select 
              value={filterEntity} 
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            >
              <option value="ALL">All Entities</option>
              {categories.entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Search Details</label>
            <input 
              type="text"
              placeholder="Search ID or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logsQ.isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 h-12 bg-gray-50/50"></td>
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${
                          log.action.includes('BAN') || log.action.includes('DELETE') || log.action.includes('REJECT') ? 'bg-red-100 text-red-700 border border-red-200' :
                          log.action.includes('APPROVE') || log.action.includes('CREATE') ? 'bg-green-100 text-green-700 border border-green-200' :
                          'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{log.entity}</span>
                          <span className="text-gray-400 text-[10px] font-mono truncate max-w-[150px]">{log.entityId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs overflow-hidden">
                          <pre className="text-[10px] bg-gray-50 p-2 rounded-lg border border-gray-100 overflow-x-auto">
                            {log.after ? JSON.stringify(log.after, null, 2) : '-'}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-4xl mb-2 flex justify-center text-gray-300"><IoSearchOutline /></span>
                        <p className="text-gray-500 font-medium">No audit logs match your filters.</p>
                        <button 
                          onClick={() => { setFilterAction('ALL'); setFilterEntity('ALL'); setSearchQuery(''); }}
                          className="mt-2 text-green-600 text-sm font-bold hover:underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
