import {
  exportReportPDF,
  exportReportWord,
  exportScrapedJSON,
  exportScrapedCSV,
  exportScrapedMarkdown,
  exportScrapedHTML,
} from '../utils/exportUtils.js';

export default function ResultsCard({ analysis, scrapedData, meta, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="results-panel glass">
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">Analyzing competitors...</div>
          <div className="loading-sub">Scraping websites &amp; running AI analysis. This may take 30-60 seconds.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-panel glass">
        <div className="results-empty">
          <div className="results-empty-icon">⚠️</div>
          <h3>Analysis Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="results-panel glass">
        <div className="results-empty">
          <div className="results-empty-icon">📊</div>
          <h3>No Analysis Yet</h3>
          <p>Enter competitor URLs on the left and click Analyze to get AI-powered competitive insights.</p>
        </div>
      </div>
    );
  }

  const { executiveSummary, competitors = [], marketGaps = [], opportunities = [], recommendations = [] } = analysis;

  return (
    <div className="results-panel glass">
      <div className="results-content">
        {/* Executive Summary */}
        <div className="results-header animate-in">
          <h2>📋 Competitive Intelligence Report</h2>
          <p className="results-summary">{executiveSummary}</p>

          {/* ── Download Toolbar ── */}
          <div className="download-toolbar">
            <div className="download-group">
              <span className="download-label">📄 Report</span>
              <button className="dl-btn dl-pdf" onClick={() => exportReportPDF(analysis, meta)}>PDF</button>
              <button className="dl-btn dl-word" onClick={() => exportReportWord(analysis, meta)}>Word</button>
            </div>
            {scrapedData && (
              <div className="download-group">
                <span className="download-label">🗂️ Scraped Data</span>
                <button className="dl-btn dl-csv" onClick={() => exportScrapedCSV(scrapedData)}>CSV</button>
                <button className="dl-btn dl-json" onClick={() => exportScrapedJSON(scrapedData, meta)}>JSON</button>
                <button className="dl-btn dl-md" onClick={() => exportScrapedMarkdown(scrapedData, meta)}>MD</button>
                <button className="dl-btn dl-html" onClick={() => exportScrapedHTML(scrapedData, meta)}>HTML</button>
              </div>
            )}
          </div>
        </div>

        {/* Competitors */}
        {competitors.length > 0 && (
          <div className="section" style={{ animationDelay: '.1s' }}>
            <div className="section-title"><span className="section-icon">🏢</span> Competitor Breakdown</div>
            <div className="competitor-cards">
              {competitors.map((c, i) => (
                <div className="competitor-card" key={i}>
                  <div className="competitor-name">{c.name || `Competitor ${i + 1}`}</div>
                  <div className="competitor-url">{c.url}</div>
                  <div className="competitor-overview">{c.overview}</div>
                  <div className="competitor-details">
                    <div className="detail-group">
                      <h5>Strengths</h5>
                      <ul>{(c.strengths || []).map((s, j) => <li key={j}>{s}</li>)}</ul>
                    </div>
                    <div className="detail-group">
                      <h5>Weaknesses</h5>
                      <ul>{(c.weaknesses || []).map((w, j) => <li key={j}>{w}</li>)}</ul>
                    </div>
                    <div className="detail-group">
                      <h5>Products / Services</h5>
                      <ul>{(c.products || []).map((p, j) => <li key={j}>{p}</li>)}</ul>
                    </div>
                    <div className="detail-group">
                      <h5>Technology</h5>
                      <ul>{(c.technology || []).map((t, j) => <li key={j}>{t}</li>)}</ul>
                    </div>
                  </div>
                  {c.pricingStrategy && (
                    <div className="detail-group" style={{ marginTop: 10 }}>
                      <h5>Pricing Strategy</h5>
                      <div className="detail-text">{c.pricingStrategy}</div>
                    </div>
                  )}
                  {c.contentStrategy && (
                    <div className="detail-group" style={{ marginTop: 10 }}>
                      <h5>Content &amp; SEO</h5>
                      <div className="detail-text">{c.contentStrategy}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Gaps */}
        {marketGaps.length > 0 && (
          <div className="section" style={{ animationDelay: '.2s' }}>
            <div className="section-title"><span className="section-icon">🔓</span> Market Gaps</div>
            <div className="gap-list">
              {marketGaps.map((g, i) => (
                <div className="gap-card" key={i}>
                  <div className="gap-card-header">
                    <span className="gap-title">{g.gap}</span>
                    <span className={`badge badge-${g.priority}`}>{g.priority}</span>
                  </div>
                  <div className="gap-desc">{g.opportunity}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="section" style={{ animationDelay: '.3s' }}>
            <div className="section-title"><span className="section-icon">💡</span> Opportunities</div>
            <div className="opp-list">
              {opportunities.map((o, i) => (
                <div className="opp-card" key={i}>
                  <div className="opp-title">{o.title}</div>
                  <div className="opp-desc">{o.description}</div>
                  {o.actionItems?.length > 0 && (
                    <ul className="opp-actions">
                      {o.actionItems.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="section" style={{ animationDelay: '.4s' }}>
            <div className="section-title"><span className="section-icon">🚀</span> Recommendations</div>
            <div className="rec-list">
              {recommendations.map((r, i) => (
                <div className="rec-card" key={i}>
                  <div className="rec-card-header">
                    <span className="rec-title">{r.category}: {r.recommendation}</span>
                    <span className={`badge badge-${r.impact}`}>{r.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
