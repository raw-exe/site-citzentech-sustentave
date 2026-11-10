// Confere o modelo contra os valores aprovados na análise (etapas 3 a 6).
const fs = require('fs');
const path = require('path');
const M = require('../js/model.js');
const par = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/parametros.json'), 'utf8'));
const r = M.calcular(M.achatar(par));
const A = r.alt;
const esperado = [
  ['base kWh/ano', A.base.kwh_ano, 9557, 1],
  ['base R$/ano', A.base.custo_ano, 8546, 1],
  ['base kg CO2/ano', A.base.kwh_ano * 0.0385, 368, 1],
  ['A1 kWh/ano', A.a1.kwh_ano, 3769, 2],
  ['A1 economia %', A.a1.economia_pct, 60.6, 0.1],
  ['A1 CAPEX', A.a1.capex, 43486, 1],
  ['A1 payback', A.a1.payback_anos, 8.2, 0.05],
  ['A1 CO2 evitado', A.a1.co2_evitado_kg_ano, 223, 1],
  ['A2 CAPEX', A.a2.capex, 101606, 2],
  ['A2 payback simples', A.a2.payback_anos, 13.1, 0.05],
  ['A2 bateria kWh', A.a2.bateria_kwh, 25.8, 0.05],
  ['A2 troca bateria R$', A.a2.troca_bateria, 27881, 2],
  ['A2 PV kWp', A.a2.pv_kwp, 5.2, 0.001],
  ['A3 kWh/ano', A.a3.kwh_ano, 418, 2],
  ['A3 CAPEX', A.a3.capex, 56986, 1],
  ['A3 renovavel %', A.a3.renovavel_pct, 88.9, 0.1],
  ['A3 payback', A.a3.payback_anos, 7.2, 0.05],
  ['A3 CO2 evitado', A.a3.co2_evitado_kg_ano, 352, 1],
  ['A3 reducao R$/mes', A.a3.reducao_rs_mes, 655, 1],
  ['horas equivalentes', r.heq, 8.0, 0.01]
];
let falhas = 0;
for (const [n, got, exp, tol] of esperado) {
  const ok = Math.abs(got - exp) <= tol;
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' ' + n.padEnd(22) + got.toFixed(2).padStart(10) + '  esperado ' + exp);
}
console.log('A2 payback com trocas de bateria:', A.a2.payback_com_trocas.toFixed(1), 'anos');
console.log('Decomposição A1:', JSON.stringify(r.decomp, (k, x) => typeof x === 'number' ? Math.round(x) : x));
const h = M.perfilHorario(M.achatar(par));
console.log('Soma horária LED (kWh/noite x 365):', (h.reduce((s, x) => s + x.led_kw, 0) * 365).toFixed(0), 'vs A1', A.a1.kwh_ano.toFixed(0));
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTodos os valores conferem.');
process.exit(falhas ? 1 : 0);
