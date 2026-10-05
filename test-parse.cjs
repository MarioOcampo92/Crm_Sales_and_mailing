const fs = require('fs');
const text = fs.readFileSync('esteticas_castellon_leads_COMPLETO.csv', 'utf8');
const lines = text.split('\n').filter((line) => line.trim());
console.log('Total lines:', lines.length);

function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

const firstLine = lines[1];
const fields = parseLine(firstLine);
console.log('Fields of first lead:', fields);
