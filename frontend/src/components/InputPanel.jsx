import { useState } from 'react';

export default function InputPanel({ onAnalyze, isLoading }) {
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [urls, setUrls] = useState(['']);

  function addUrl() {
    if (urls.length < 5) setUrls([...urls, '']);
  }

  function removeUrl(index) {
    if (urls.length > 1) setUrls(urls.filter((_, i) => i !== index));
  }

  function updateUrl(index, value) {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validUrls = urls.filter((u) => u.trim());
    if (!businessName.trim() || !industry.trim() || validUrls.length === 0) return;
    onAnalyze({ businessName: businessName.trim(), industry: industry.trim(), competitorUrls: validUrls });
  }

  return (
    <div className="input-panel glass">
      <div className="panel-title">🎯 <span>Competitor</span> Analysis</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="business-name">Your Business Name</label>
          <input
            id="business-name"
            className="form-input"
            placeholder="e.g. My Startup"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="industry">Industry / Niche</label>
          <input
            id="industry"
            className="form-input"
            placeholder="e.g. E-commerce, SaaS, Fintech"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <label className="form-label">Competitor URLs</label>
        <div className="url-list">
          {urls.map((url, i) => (
            <div className="url-row" key={i}>
              <input
                className="form-input"
                placeholder={`https://competitor${i + 1}.com`}
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                type="url"
                required
                disabled={isLoading}
              />
              {urls.length > 1 && (
                <button type="button" className="url-remove" onClick={() => removeUrl(i)} disabled={isLoading}>✕</button>
              )}
            </div>
          ))}
        </div>
        <div className="url-counter">{urls.length}/5 competitors</div>
        <button
          type="button"
          className="add-url-btn"
          onClick={addUrl}
          disabled={urls.length >= 5 || isLoading}
        >
          + Add Competitor URL
        </button>

        <button className="btn btn-primary analyze-btn" type="submit" disabled={isLoading} id="analyze-btn">
          {isLoading ? (
            <><span className="spinner" /> Analyzing...</>
          ) : (
            <>🔍 Analyze Competitors</>
          )}
        </button>
      </form>
    </div>
  );
}
