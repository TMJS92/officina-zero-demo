const $ = id => document.getElementById(id);
let original = [], result = [], separator = ',', version = 0;
function showPreview(id, rows) {
  const table = $(id); table.replaceChildren();
  rows.slice(0, 10).forEach(row => {
    const tr = document.createElement('tr');
    row.slice(0, 15).forEach(value => {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    });
    table.append(tr);
  });
}
function transform() {
  const cleaned = cleanRows(original, {trim: $('trim').checked, dedup: $('dedup').checked, header: $('header').checked});
  result = cleaned.rows;
  const irregular = original.filter(row => row.length !== (original[0]?.length || 0)).length;
  $('stats').textContent = `Righe originali: ${original.length} (intestazione inclusa). Righe finali: ${result.length}. Duplicati rimossi: ${cleaned.duplicates}. Celle ripulite: ${cleaned.trimmed}.`;
  $('warning').textContent = irregular ? `Attenzione: ${irregular} righe hanno un numero di colonne diverso dalla prima. Verifica il separatore e l'anteprima prima di esportare.` : '';
  showPreview('before', original); showPreview('after', result);
  $('download').disabled = !result.length;
}
async function load() {
  const token = ++version; original = []; result = []; transform(); $('error').textContent = '';
  const file = $('file').files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { $('error').textContent = 'Limite del prototipo: 5 MB per file.'; return; }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    if (token !== version) return;
    separator = $('separator').value === 'auto' ? detectDelimiter(text) : $('separator').value;
    original = parseCSV(text, separator);
    $('detected').textContent = `Separatore utilizzato: ${separator === '\t' ? 'tabulazione' : separator}`;
    transform();
  } catch (error) { if (token === version) $('error').textContent = `${error.message} Sono supportati file UTF-8; l'originale non è stato modificato.`; }
}
$('file').addEventListener('change', load);
$('separator').addEventListener('change', load);
for (const id of ['trim', 'dedup', 'header']) $(id).addEventListener('change', transform);
$('download').addEventListener('click', () => {
  const csv = serializeCSV(result, separator, $('protect').checked);
  const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'csv-pronto.csv';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
});
$('sample').addEventListener('click', () => {
  version++; separator = ';';
  original = parseCSV('nome;categoria;nota\r\n Anna ; A ;"esempio, non cliente"\r\nAnna;A;"esempio, non cliente"\r\nLuca;B;"nota su\ndue righe"', separator);
  $('file').value = ''; $('error').textContent = ''; $('detected').textContent = 'Dati dimostrativi fittizi; separatore: ;'; transform();
});
