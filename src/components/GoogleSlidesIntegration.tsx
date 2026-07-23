import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleSlidesIntegrationProps {
  user: User | null;
  slidesToken: string | null;
}

export const GoogleSlidesIntegration: React.FC<GoogleSlidesIntegrationProps> = ({ user, slidesToken }) => {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slidesToken) {
      fetchPresentations();
    }
  }, [slidesToken]);

  const fetchPresentations = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent("mimeType='application/vnd.google-apps.presentation' and trashed=false");
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
        headers: { Authorization: `Bearer ${slidesToken}` }
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setPresentations(data.files || []);
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
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-200">Google Slides</h2>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {!slidesToken ? (
          <div className="text-center text-slate-500 py-8">Authentification requise pour accéder à Google Slides.</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        ) : presentations.length === 0 ? (
          <div className="text-center text-slate-500 py-8">Aucune présentation trouvée.</div>
        ) : (
          <div className="space-y-4">
            {presentations.map((file) => (
              <div key={file.id} className="p-4 border border-slate-800 bg-slate-900 rounded-lg">
                <h3 className="font-medium text-slate-200">{file.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Modifié: {new Date(file.modifiedTime).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
