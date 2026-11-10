// Gera js/parametros.js a partir de data/parametros.json (fonte única das premissas).
const fs = require('fs'), path = require('path');
const json = fs.readFileSync(path.join(__dirname, '../data/parametros.json'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../js/parametros.js'),
  '// Gerado por tools/gerar-parametros.js a partir de data/parametros.json. Não editar à mão.\nwindow.PARAMETROS = ' + json.trim() + ';\n');
console.log('js/parametros.js gerado');
