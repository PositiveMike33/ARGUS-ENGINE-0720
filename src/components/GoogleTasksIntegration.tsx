import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertCircle, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleTasksIntegrationProps {
  user: User | null;
  tasksToken: string | null;
}

export const GoogleTasksIntegration: React.FC<GoogleTasksIntegrationProps> = ({ user, tasksToken }) => {
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tasksToken) {
      fetchTaskLists();
    }
  }, [tasksToken]);

  const fetchTaskLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/tasklists', {
        headers: { Authorization: `Bearer ${tasksToken}` }
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setTaskLists(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-200">Google Tasks</h2>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {!tasksToken ? (
          <div className="text-center text-slate-500 py-8">Authentification requise pour accéder à Google Tasks.</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        ) : taskLists.length === 0 ? (
          <div className="text-center text-slate-500 py-8">Aucune liste de tâches trouvée.</div>
        ) : (
          <div className="space-y-4">
            {taskLists.map((list) => (
              <div key={list.id} className="p-4 border border-slate-800 bg-slate-900 rounded-lg">
                <h3 className="font-medium text-slate-200">{list.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Modifié: {new Date(list.updated).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
