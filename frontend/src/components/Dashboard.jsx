import { useState, useEffect, useCallback } from 'react';
import Header from './Header.jsx';
import InputPanel from './InputPanel.jsx';
import ResultsCard from './ResultsCard.jsx';
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

  // Load history from localStorage
  const loadHistory = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('scoutai-history') || '[]');
      setHistory(saved);
    } catch { setHistory([]); }
  }, []);

  const saveHistory = (items) => {
    localStorage.setItem('scoutai-history', JSON.stringify(items));
    setHistory(items);
  };

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

      // Save to localStorage
      const newItem = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        business_name: businessName,
        industry,
        competitor_urls: competitorUrls,
        scraped_data: data.scrapedData,
        ai_analysis: data.analysis,
        summary: data.analysis?.executiveSummary || 'Analysis complete',
      };
      const updated = [newItem, ...history];
      saveHistory(updated);
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
  function handleDeleteHistory(id) {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (activeHistoryId === id) { setAnalysis(null); setActiveHistoryId(null); }
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
