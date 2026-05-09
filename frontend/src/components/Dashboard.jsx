import { useState, useEffect, useCallback } from 'react';
import Header from './Header.jsx';
import InputPanel from './InputPanel.jsx';
import ResultsCard from './ResultsCard.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import HistoryPanel from './HistoryPanel.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [scrapedData, setScrapedData] = useState(null);
  const [meta, setMeta] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  const { user } = useAuth();

  // Load history from Supabase
  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setHistory(data);
    }
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Run analysis
  async function handleAnalyze({ businessName, industry, competitorUrls }) {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setActiveHistoryId(null);

    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, industry, competitorUrls }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAnalysis(data.analysis);
      setScrapedData(data.scrapedData);
      setMeta({ businessName, industry });

      // Save to Supabase
      const newItem = {
        user_id: user.id,
        business_name: businessName,
        industry,
        competitor_urls: competitorUrls,
        scraped_data: data.scrapedData,
        ai_analysis: data.analysis,
        summary: data.analysis?.executiveSummary || 'Analysis complete',
        status: 'completed'
      };
      
      const { data: insertedData, error: dbError } = await supabase
        .from('analyses')
        .insert([newItem])
        .select()
        .single();

      if (dbError) {
        console.error('Supabase Error:', dbError);
        setError(`Warning: Analysis completed, but failed to save to history (${dbError.message || 'Check database tables'}).`);
      } else if (insertedData) {
        setHistory((prev) => [insertedData, ...prev]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // View historical analysis
  function handleSelectHistory(item) {
    setActiveHistoryId(item.id);
    setAnalysis(item.ai_analysis);
    setScrapedData(item.scraped_data || null);
    setMeta({ businessName: item.business_name, industry: item.industry });
    setError(null);
  }

  // Delete history item
  async function handleDeleteHistory(id) {
    const { error } = await supabase.from('analyses').delete().eq('id', id);
    if (!error) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (activeHistoryId === id) { setAnalysis(null); setActiveHistoryId(null); }
    }
  }

  return (
    <div className="app-layout">
      <Header />
      <main className="dashboard">
        <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
        <ResultsCard analysis={analysis} scrapedData={scrapedData} meta={meta} isLoading={isLoading} error={error} />
        <HistoryPanel
          history={history}
          onSelect={handleSelectHistory}
          activeId={activeHistoryId}
          onDelete={handleDeleteHistory}
        />
      </main>
    </div>
  );
}
