export default function HistoryPanel({ history, onSelect, activeId, onDelete }) {
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function extractDomain(url) {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  }

  return (
    <div className="history-panel glass">
      <div className="panel-title">📁 <span>Analysis</span> History</div>

      {history.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">🕐</div>
          <p>Your past analyses will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div
              key={item.id}
              className={`history-card ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <div className="history-card-title">{item.business_name}</div>
              <div className="history-card-industry">{item.industry}</div>
              <div className="history-card-urls">
                {(item.competitor_urls || []).slice(0, 3).map((u, i) => (
                  <span key={i}>{extractDomain(u)}</span>
                ))}
              </div>
              <div className="history-card-date">{formatDate(item.created_at)}</div>
              <button
                className="history-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
