function parseCSV(text, sep) {
  text = text.replace(/^\uFEFF/, '');
  if (!text.length) return [];
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += c;
      continue;
    }
    if (c === sep) { row.push(cell); cell = ''; closed = false; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = ''; closed = false;
    } else if (closed) throw new Error('Carattere inatteso dopo una virgoletta di chiusura.');
    else if (c === '"') {
      if (cell.length) throw new Error('Virgoletta inattesa in un campo non quotato.');
      quoted = true;
    } else cell += c;
  }
  if (quoted) throw new Error('Campo tra virgolette non chiuso.');
  if (cell.length || row.length || closed) { row.push(cell); rows.push(row); }
  return rows;
}
function detectDelimiter(text) {
  let best = ',', score = -1;
  for (const sep of [',', ';', '\t']) {
    try {
      const rows = parseCSV(text, sep).filter(row => row.some(value => value.trim() !== '')).slice(0, 20);
      const width = rows[0]?.length || 1;
      const current = width > 1 ? width * rows.filter(r => r.length === width).length : 0;
      if (current > score) { best = sep; score = current; }
    } catch (_) {}
  }
  return best;
}
function cleanRows(rows, options) {
  const output = [], seen = new Set(); let duplicates = 0, trimmed = 0;
  rows.forEach((row, index) => {
    const cleaned = row.map(value => {
      const result = options.trim ? value.trim() : value;
      if (result !== value) trimmed++;
      return result;
    });
    if (options.header && index === 0) { output.push(cleaned); return; }
    const key = JSON.stringify(cleaned);
    if (options.dedup && seen.has(key)) { duplicates++; return; }
    seen.add(key); output.push(cleaned);
  });
  return {rows: output, duplicates, trimmed};
}
function serializeCSV(rows, sep, protectFormulas) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    const safe = protectFormulas && /^[\s]*[=+\-@]/.test(value) ? "'" + value : value;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(sep)).join('\r\n');
}
if (typeof module !== 'undefined') module.exports = {parseCSV, detectDelimiter, cleanRows, serializeCSV};
