import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export function AdminAuditLogPage() {
  const navigate = useNavigate();

  const logsQ = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => (await api.get('/admin/audit-log')).data
  });

  const logs = logsQ.data?.logs || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-6 font-medium transition-colors">
          <span className="text-xl">←</span><span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📜 System Audit Logs</h1>
          <p className="text-gray-600">Track all administrative actions and system changes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
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
              ) : logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        log.action.includes('BAN') ? 'bg-red-100 text-red-700' :
                        log.action.includes('APPROVE') ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.entity} <span className="text-gray-400 text-xs font-normal">({log.entityId})</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {log.after ? JSON.stringify(log.after) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
