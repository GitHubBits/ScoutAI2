import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT EXPORTS (AI Analysis)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PDF ────────────────────────────────────────────────────────────────────────
export function exportReportPDF(analysis, meta = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const textW = pageW - margin * 2;
  let y = 20;

  function checkPage(needed = 20) {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  }

  function heading(text, size = 14) {
    checkPage(20);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text(text, margin, y);
    y += size * 0.6 + 2;
  }

  function subheading(text) {
    checkPage(14);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 60);
    doc.text(text, margin, y);
    y += 7;
  }

  function body(text) {
    checkPage(12);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);
    const lines = doc.splitTextToSize(text || '—', textW);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 3;
  }

  function separator() {
    checkPage(8);
    doc.setDrawColor(200, 210, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  }

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 30);
  doc.text('ScoutAI — Competitive Intelligence Report', margin, y);
  y += 10;

  if (meta.businessName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 120);
    doc.text(`Business: ${meta.businessName}  |  Industry: ${meta.industry || '—'}  |  Date: ${timestamp()}`, margin, y);
    y += 10;
  }

  separator();

  // Executive Summary
  heading('Executive Summary');
  body(analysis.executiveSummary);
  separator();

  // Competitors
  if (analysis.competitors?.length) {
    heading('Competitor Breakdown');
    analysis.competitors.forEach((c, i) => {
      checkPage(50);
      subheading(`${i + 1}. ${c.name || c.url}`);
      if (c.url) { body(`URL: ${c.url}`); }
      if (c.overview) { body(c.overview); }

      // Table of strengths/weaknesses
      const rows = [];
      const maxLen = Math.max((c.strengths || []).length, (c.weaknesses || []).length);
      for (let j = 0; j < maxLen; j++) {
        rows.push([(c.strengths || [])[j] || '', (c.weaknesses || [])[j] || '']);
      }
      if (rows.length) {
        checkPage(rows.length * 8 + 15);
        autoTable(doc, {
          startY: y,
          head: [['Strengths', 'Weaknesses']],
          body: rows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8.5, cellPadding: 3 },
          headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 252] },
          theme: 'grid',
        });
        y = doc.lastAutoTable.finalY + 6;
      }

      if (c.products?.length) { body(`Products/Services: ${c.products.join(', ')}`); }
      if (c.pricingStrategy) { body(`Pricing: ${c.pricingStrategy}`); }
      if (c.contentStrategy) { body(`Content/SEO: ${c.contentStrategy}`); }
      if (c.technology?.length) { body(`Technology: ${c.technology.join(', ')}`); }
      if (c.socialProof) { body(`Social Proof: ${c.socialProof}`); }
      y += 4;
    });
    separator();
  }

  // Market Gaps
  if (analysis.marketGaps?.length) {
    heading('Market Gaps');
    const gapRows = analysis.marketGaps.map((g) => [g.gap, g.opportunity, (g.priority || '').toUpperCase()]);
    checkPage(gapRows.length * 10 + 15);
    autoTable(doc, {
      startY: y,
      head: [['Gap', 'Opportunity', 'Priority']],
      body: gapRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'center', cellWidth: 22 } },
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 8;
    separator();
  }

  // Opportunities
  if (analysis.opportunities?.length) {
    heading('Opportunities');
    analysis.opportunities.forEach((o) => {
      subheading(o.title);
      body(o.description);
      if (o.actionItems?.length) {
        body('Action Items: ' + o.actionItems.join(' • '));
      }
    });
    separator();
  }

  // Recommendations
  if (analysis.recommendations?.length) {
    heading('Recommendations');
    const recRows = analysis.recommendations.map((r) => [r.category, r.recommendation, (r.impact || '').toUpperCase()]);
    checkPage(recRows.length * 10 + 15);
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Recommendation', 'Impact']],
      body: recRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'center', cellWidth: 22 } },
      theme: 'grid',
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 180);
    doc.text(`ScoutAI Report  •  Page ${i} of ${totalPages}  •  Generated ${timestamp()}`, margin, 290);
  }

  const safeName = (meta.businessName || 'analysis').replace(/[^a-z0-9]/gi, '_');
  doc.save(`ScoutAI_Report_${safeName}_${timestamp()}.pdf`);
}

// ─── Word (HTML → .doc) ────────────────────────────────────────────────────────
export function exportReportWord(analysis, meta = {}) {
  const styles = `
    <style>
      body { font-family: Calibri, Arial, sans-serif; color: #1a1a2e; padding: 30px; }
      h1 { color: #06b6d4; font-size: 24px; border-bottom: 2px solid #06b6d4; padding-bottom: 8px; }
      h2 { color: #8b5cf6; font-size: 18px; margin-top: 24px; }
      h3 { color: #333; font-size: 14px; margin-top: 16px; }
      p { font-size: 12px; line-height: 1.6; color: #444; }
      table { border-collapse: collapse; width: 100%; margin: 10px 0; }
      th { background: #06b6d4; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
      td { border: 1px solid #ddd; padding: 6px 12px; font-size: 11px; }
      tr:nth-child(even) { background: #f5f7fc; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
      .high { background: #fee2e2; color: #dc2626; }
      .medium { background: #fef3c7; color: #d97706; }
      .low { background: #d1fae5; color: #059669; }
      .meta { color: #888; font-size: 11px; margin-bottom: 20px; }
      hr { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
    </style>`;

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">${styles}</head><body>`;

  html += `<h1>⚡ ScoutAI — Competitive Intelligence Report</h1>`;
  html += `<p class="meta">Business: <strong>${meta.businessName || '—'}</strong> | Industry: <strong>${meta.industry || '—'}</strong> | Date: ${timestamp()}</p><hr>`;

  // Executive Summary
  html += `<h2>📋 Executive Summary</h2><p>${analysis.executiveSummary || '—'}</p><hr>`;

  // Competitors
  if (analysis.competitors?.length) {
    html += `<h2>🏢 Competitor Breakdown</h2>`;
    analysis.competitors.forEach((c, i) => {
      html += `<h3>${i + 1}. ${c.name || 'Competitor'} <span style="color:#06b6d4;font-size:11px;">(${c.url})</span></h3>`;
      html += `<p>${c.overview || ''}</p>`;
      html += `<table><tr><th>Strengths</th><th>Weaknesses</th></tr>`;
      const maxLen = Math.max((c.strengths || []).length, (c.weaknesses || []).length);
      for (let j = 0; j < maxLen; j++) {
        html += `<tr><td>${(c.strengths || [])[j] || ''}</td><td>${(c.weaknesses || [])[j] || ''}</td></tr>`;
      }
      html += `</table>`;
      if (c.products?.length) html += `<p><strong>Products:</strong> ${c.products.join(', ')}</p>`;
      if (c.pricingStrategy) html += `<p><strong>Pricing:</strong> ${c.pricingStrategy}</p>`;
      if (c.contentStrategy) html += `<p><strong>Content/SEO:</strong> ${c.contentStrategy}</p>`;
      if (c.technology?.length) html += `<p><strong>Technology:</strong> ${c.technology.join(', ')}</p>`;
    });
    html += `<hr>`;
  }

  // Market Gaps
  if (analysis.marketGaps?.length) {
    html += `<h2>🔓 Market Gaps</h2><table><tr><th>Gap</th><th>Opportunity</th><th>Priority</th></tr>`;
    analysis.marketGaps.forEach((g) => {
      html += `<tr><td>${g.gap}</td><td>${g.opportunity}</td><td><span class="badge ${g.priority}">${(g.priority || '').toUpperCase()}</span></td></tr>`;
    });
    html += `</table><hr>`;
  }

  // Opportunities
  if (analysis.opportunities?.length) {
    html += `<h2>💡 Opportunities</h2>`;
    analysis.opportunities.forEach((o) => {
      html += `<h3>${o.title}</h3><p>${o.description}</p>`;
      if (o.actionItems?.length) {
        html += `<ul>${o.actionItems.map((a) => `<li>${a}</li>`).join('')}</ul>`;
      }
    });
    html += `<hr>`;
  }

  // Recommendations
  if (analysis.recommendations?.length) {
    html += `<h2>🚀 Recommendations</h2><table><tr><th>Category</th><th>Recommendation</th><th>Impact</th></tr>`;
    analysis.recommendations.forEach((r) => {
      html += `<tr><td>${r.category}</td><td>${r.recommendation}</td><td><span class="badge ${r.impact}">${(r.impact || '').toUpperCase()}</span></td></tr>`;
    });
    html += `</table>`;
  }

  html += `<hr><p class="meta">Generated by ScoutAI on ${timestamp()}</p></body></html>`;

  const safeName = (meta.businessName || 'analysis').replace(/[^a-z0-9]/gi, '_');
  const blob = new Blob([html], { type: 'application/msword' });
  downloadBlob(blob, `ScoutAI_Report_${safeName}_${timestamp()}.doc`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRAPED DATA EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── JSON ───────────────────────────────────────────────────────────────────────
export function exportScrapedJSON(scrapedData, meta = {}) {
  const payload = {
    exportedAt: new Date().toISOString(),
    business: meta.businessName || '',
    industry: meta.industry || '',
    competitors: scrapedData,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `ScoutAI_ScrapedData_${timestamp()}.json`);
}

// ─── CSV ────────────────────────────────────────────────────────────────────────
export function exportScrapedCSV(scrapedData) {
  const escape = (v) => `"${String(v || '').replace(/"/g, '""')}"`;

  const headers = ['URL', 'Title', 'Description', 'Content Preview (500 chars)', 'Error'];
  const rows = scrapedData.map((d) => [
    escape(d.url),
    escape(d.metadata?.title || ''),
    escape(d.metadata?.description || ''),
    escape((d.content || '').substring(0, 500)),
    escape(d.error || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `ScoutAI_ScrapedData_${timestamp()}.csv`);
}

// ─── Markdown ───────────────────────────────────────────────────────────────────
export function exportScrapedMarkdown(scrapedData, meta = {}) {
  let md = `# ScoutAI — Scraped Competitor Data\n\n`;
  md += `**Business:** ${meta.businessName || '—'}  \n`;
  md += `**Industry:** ${meta.industry || '—'}  \n`;
  md += `**Exported:** ${new Date().toLocaleString()}  \n\n---\n\n`;

  scrapedData.forEach((d, i) => {
    md += `## ${i + 1}. ${d.metadata?.title || d.url}\n\n`;
    md += `**URL:** ${d.url}  \n`;
    if (d.metadata?.description) md += `**Description:** ${d.metadata.description}  \n`;
    if (d.error) {
      md += `\n> ⚠️ Scraping Error: ${d.error}\n\n`;
    } else {
      md += `\n### Content\n\n${d.content || '*No content extracted*'}\n\n`;
    }
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  downloadBlob(blob, `ScoutAI_ScrapedData_${timestamp()}.md`);
}

// ─── HTML ───────────────────────────────────────────────────────────────────────
export function exportScrapedHTML(scrapedData, meta = {}) {
  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>ScoutAI Scraped Data</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; background: #f8fafc; }
  h1 { color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 8px; }
  h2 { color: #8b5cf6; margin-top: 30px; }
  .meta { color: #888; font-size: 14px; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
  .url { color: #06b6d4; font-size: 13px; word-break: break-all; }
  .content { white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #475569; max-height: 400px; overflow-y: auto; background: #f1f5f9; padding: 14px; border-radius: 8px; margin-top: 10px; }
  .error { background: #fef2f2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 13px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
</style></head><body>`;

  html += `<h1>⚡ ScoutAI — Scraped Competitor Data</h1>`;
  html += `<p class="meta">Business: <strong>${meta.businessName || '—'}</strong> | Industry: <strong>${meta.industry || '—'}</strong> | Exported: ${new Date().toLocaleString()}</p><hr>`;

  scrapedData.forEach((d, i) => {
    html += `<div class="card"><h2>${i + 1}. ${d.metadata?.title || 'Untitled'}</h2>`;
    html += `<div class="url">${d.url}</div>`;
    if (d.error) {
      html += `<div class="error">⚠️ ${d.error}</div>`;
    } else {
      html += `<div class="content">${(d.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    }
    html += `</div>`;
  });

  html += `<hr><p class="meta">Generated by ScoutAI on ${new Date().toLocaleString()}</p></body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, `ScoutAI_ScrapedData_${timestamp()}.html`);
}
