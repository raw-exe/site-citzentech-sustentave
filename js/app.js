/* Interface do site. Todos os cálculos vêm de PracaModel (js/model.js). */
(function () {
  'use strict';
  const M = window.PracaModel;
  const DEFAULT = window.PARAMETROS;
  let raw = clone(DEFAULT);
  let P, R;

  /* ---------- utilidades ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  const fmt = (n, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const brl = (n, d = 0) => 'R$ ' + fmt(n, d);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const reduzMov = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const NOMES = { base: 'Sódio atual', a1: 'LED com sensores', a2: 'Solar autônomo', a3: 'LED com sensores e FV na rede' };
  const COR = { base: '--c-base', a1: '--c-a1', a2: '--c-a2', a3: '--c-a3' };

  function recalcular() {
    P = M.achatar(raw);
    R = M.calcular(P);
    renderTudo();
  }

  /* ============================================================
     MAPA DA PRAÇA
     ============================================================ */
  const POSTES = [];
  (function montarPostes() {
    for (let i = 0; i < 10; i++) {
      const a = (18 + i * 36) * Math.PI / 180;
      POSTES.push({ x: 200 + 150 * Math.cos(a), y: 210 + 105 * Math.sin(a), g: 'c' });
    }
    [[200, 157], [200, 263], [125, 210], [275, 210]].forEach(([x, y]) => POSTES.push({ x, y, g: 'c' }));
    [[90, 262], [170, 262], [410, 140], [584, 140], [410, 300], [584, 300]].forEach(([x, y]) => POSTES.push({ x, y, g: 'q' }));
  })();
  const estado = { cen: 'base', hora: 2, tocando: false, timer: null };

  function desenharSolo() {
    const g = $('#mapa-solo');
    g.innerHTML = '';
    el('rect', { x: 14, y: 14, width: 612, height: 412, rx: 10, fill: '#183462' }, g);
    // caminhos
    const cam = '#2C4380';
    el('ellipse', { cx: 200, cy: 210, rx: 150, ry: 105, fill: 'none', stroke: cam, 'stroke-width': 16 }, g);
    el('line', { x1: 200, y1: 105, x2: 200, y2: 315, stroke: cam, 'stroke-width': 12 }, g);
    el('line', { x1: 50, y1: 210, x2: 350, y2: 210, stroke: cam, 'stroke-width': 12 }, g);
    el('line', { x1: 350, y1: 210, x2: 430, y2: 210, stroke: cam, 'stroke-width': 10 }, g);
    // playground
    el('circle', { cx: 130, cy: 268, r: 28, fill: '#223F72', stroke: '#35528E', 'stroke-width': 2 }, g);
    el('rect', { x: 118, y: 261, width: 24, height: 14, rx: 3, fill: '#35528E' }, g);
    // quadra
    el('rect', { x: 428, y: 150, width: 138, height: 140, rx: 6, fill: '#1D4F6A', stroke: '#3A7A9A', 'stroke-width': 2 }, g);
    el('line', { x1: 497, y1: 150, x2: 497, y2: 290, stroke: '#3A7A9A', 'stroke-width': 1.5 }, g);
    el('circle', { cx: 497, cy: 220, r: 20, fill: 'none', stroke: '#3A7A9A', 'stroke-width': 1.5 }, g);
    // árvores
    [[70, 120], [330, 120], [330, 305], [75, 330], [250, 372], [150, 60], [380, 60], [455, 345], [560, 360], [595, 100], [400, 215]].forEach(([x, y]) => {
      el('circle', { cx: x, cy: y, r: 16, fill: '#1B4D5E', opacity: 0.9 }, g);
    });
  }

  function atualizarMapa() {
    const perf = M.perfilHorario(P)[estado.hora];
    const nivel = estado.cen === 'base' ? 1 : perf.efetivo;
    const led = estado.cen !== 'base';
    const halos = $('#mapa-halos'), postes = $('#mapa-postes'), extra = $('#mapa-extra');
    halos.innerHTML = ''; postes.innerHTML = ''; extra.innerHTML = '';
    POSTES.forEach((p) => {
      const rBase = 22, rVar = 34;
      el('circle', { cx: p.x, cy: p.y, r: rBase + rVar * nivel, fill: led ? 'url(#g-led)' : 'url(#g-sodio)', opacity: (0.3 + 0.7 * nivel).toFixed(2) }, halos);
      el('circle', { cx: p.x, cy: p.y, r: 4.2, fill: led ? '#F4FBFF' : '#FFD08A' }, postes);
      if (estado.cen === 'a2') {
        const pn = el('rect', { x: p.x + 5, y: p.y - 13, width: 11, height: 6, rx: 1, fill: '#3AA876', stroke: '#BFF0D9', 'stroke-width': 0.8, transform: `rotate(-18 ${p.x + 10} ${p.y - 10})` }, extra);
        pn.setAttribute('opacity', '0.95');
      }
    });
    if (estado.cen === 'a3') {
      el('rect', { x: 520, y: 34, width: 86, height: 44, rx: 4, fill: '#223F72', stroke: '#3AA876', 'stroke-width': 2 }, extra);
      for (let i = 0; i < 4; i++) el('rect', { x: 528 + i * 19, y: 42, width: 15, height: 12, rx: 1.5, fill: '#3AA876' }, extra);
      const t = el('text', { x: 563, y: 68, 'text-anchor': 'middle', fill: '#BFF0D9', 'font-size': 11, 'font-family': 'Public Sans, sans-serif' }, extra);
      t.textContent = 'FV ' + fmt(P.fv_rede.kwp, 1) + ' kWp';
    }
    $('#hora-out').textContent = perf.hora + 'h';
    const kwAgora = estado.cen === 'base' ? perf.base_kw : perf.led_kw;
    $('#r-agora').textContent = fmt(kwAgora, 2) + ' kW';
    $('#r-base').textContent = fmt(perf.base_kw, 2) + ' kW';
    const noite = (estado.cen === 'base' ? R.alt.base.kwh_ano : R.alt.a1.kwh_ano) / P.geral.dias_ano;
    $('#r-noite').textContent = fmt(noite, 1) + ' kWh';
    const origem = {
      base: 'Toda a energia vem da rede, no mesmo nível a noite inteira.',
      a1: 'Energia da rede. Os sensores levam cada poste ao nível de luz necessário a cada hora.',
      a2: 'Energia do painel e da bateria de cada poste, sem ligação à rede.',
      a3: 'Energia da rede, com créditos de um sistema solar de ' + fmt(P.fv_rede.kwp, 1) + ' kWp que cobrem ' + fmt(R.alt.a3.renovavel_pct, 0) + '% do consumo no ano.'
    };
    $('#origem').textContent = origem[estado.cen];
    $('#mapa-legenda').textContent = 'Praça-modelo de cerca de 1 hectare. Brilho de cada poste: ' + Math.round(nivel * 100) + '% da potência, às ' + perf.hora + 'h.';
    desenharBarras();
  }

  function desenharBarras() {
    const s = $('#barras');
    s.innerHTML = '';
    const W = Math.max(300, Math.round(s.getBoundingClientRect().width || 1000));
    const estreito = W < 560;
    const fs = estreito ? 12 : 14;
    s.setAttribute('viewBox', '0 0 ' + W + ' 140');
    const perf = M.perfilHorario(P);
    const max = perf[0].base_kw, base = 104, alt = 66;
    const passo = (W - 24) / 12, larg = passo * (estreito ? 0.6 : 0.56), x0 = 12 + (passo - larg) / 2;
    perf.forEach((p, i) => {
      const x = x0 + i * passo;
      if (i === estado.hora) el('rect', { x: x - 7, y: 24, width: larg + 14, height: 88, rx: 6, fill: '#2A3F85' }, s);
      const hb = (p.base_kw / max) * alt;
      if (estado.cen === 'base') {
        el('rect', { x, y: base - hb, width: larg, height: hb, rx: 3, fill: '#F2A33A', opacity: 0.9 }, s);
      } else {
        el('rect', { x, y: base - hb, width: larg, height: hb, rx: 3, fill: 'none', stroke: '#F2A33A', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, s);
        const hv = (p.led_kw / max) * alt;
        el('rect', { x, y: base - hv, width: larg, height: hv, rx: 3, fill: css(COR[estado.cen]) }, s);
      }
      if (i === 0 || i === 6 || i === 11) {
        const t = el('text', { x: x + larg / 2, y: 132, 'text-anchor': 'middle', fill: '#9FB0DA', 'font-size': fs, 'font-family': 'Public Sans, sans-serif' }, s);
        t.textContent = p.hora + 'h';
      }
    });
    const l1 = el('text', { x: 12, y: 14, fill: '#F2C27A', 'font-size': fs, 'font-family': 'Public Sans, sans-serif' }, s);
    l1.textContent = estado.cen === 'base' ? 'Potência do sódio atual por hora' : (estreito ? 'Tracejado: sódio. Cheio: alternativa' : 'Tracejado: sódio atual. Cheio: ' + NOMES[estado.cen]);
  }

  function iniciarMapa() {
    desenharSolo();
    let ultW = 0;
    new ResizeObserver(() => { const w = Math.round($('#barras').getBoundingClientRect().width); if (w !== ultW) { ultW = w; if (P) desenharBarras(); } }).observe($('#barras'));
    $$('input[name=cenario]').forEach((r) => r.addEventListener('change', () => {
      estado.cen = r.value;
      const c = css(COR[r.value]);
      $('#hora').style.setProperty('--polegar', c);
      atualizarMapa();
    }));
    const h = $('#hora');
    h.addEventListener('input', () => { estado.hora = +h.value; pararPlay(); atualizarMapa(); });
    $('#play').addEventListener('click', () => (estado.tocando ? pararPlay() : tocar()));
  }
  function tocar() {
    estado.tocando = true;
    $('#play').setAttribute('aria-pressed', 'true');
    $('#play').setAttribute('aria-label', 'Pausar');
    $('#play-ico').setAttribute('d', 'M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z');
    estado.timer = setInterval(() => {
      estado.hora = (estado.hora + 1) % 12;
      $('#hora').value = estado.hora;
      atualizarMapa();
    }, 900);
  }
  function pararPlay() {
    estado.tocando = false;
    clearInterval(estado.timer);
    $('#play').setAttribute('aria-pressed', 'false');
    $('#play').setAttribute('aria-label', 'Reproduzir a noite');
    $('#play-ico').setAttribute('d', 'M7 4.5v15l12-7.5z');
  }

  /* ============================================================
     INDICADORES (visão geral)
     ============================================================ */
  const IND = [
    { k: 'kwh_mes', nome: 'Consumo de energia da rede', un: 'kWh/mês', d: 0, hoje: (b) => b.kwh_mes, menor: true },
    { k: 'economia_pct', nome: 'Economia energética', un: '%', d: 1, hoje: () => 0 },
    { k: 'reducao_rs_mes', nome: 'Redução de custos', un: 'R$/mês', d: 0, hoje: () => 0, moeda: true },
    { k: 'renovavel_pct', nome: 'Participação de energia renovável', un: '%', d: 1, hoje: () => 0 },
    { k: 'co2_evitado_kg_ano', nome: 'Emissões evitadas', un: 'kg CO₂e/ano', d: 0, hoje: () => 0 },
    { k: 'horas_eficientes', nome: 'Tempo de funcionamento eficiente', un: 'horas/dia equivalentes a plena carga', d: 1, hoje: (b) => b.horas_eficientes, menor: true },
    { k: 'payback_anos', nome: 'Retorno do investimento', un: 'anos, payback simples', d: 1, hoje: () => null, menor: true }
  ];
  let indSel = 'a3';

  function montarAbas() {
    const c = $('#abas-ind');
    c.innerHTML = '';
    ['a1', 'a2', 'a3'].forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'aba'; b.setAttribute('role', 'tab'); b.dataset.id = id;
      b.innerHTML = '<span class="ponto" style="--c:var(' + COR[id] + ')"></span>' + NOMES[id] + (id === 'a3' ? ' (recomendada)' : '');
      b.addEventListener('click', () => { indSel = id; renderLivro(); });
      b.addEventListener('keydown', (e) => {
        const ids = ['a1', 'a2', 'a3'];
        let i = ids.indexOf(id);
        if (e.key === 'ArrowRight') i = (i + 1) % 3; else if (e.key === 'ArrowLeft') i = (i + 2) % 3; else return;
        e.preventDefault(); indSel = ids[i]; renderLivro(); $('.aba[data-id=' + ids[i] + ']').focus();
      });
      c.appendChild(b);
    });
  }

  function valorInd(def, a) {
    const v = a[def.k];
    if (v === null || v === undefined) return '—';
    return def.moeda ? brl(v) : fmt(v, def.d);
  }

  function renderLivro() {
    $$('.aba').forEach((b) => { b.setAttribute('aria-selected', b.dataset.id === indSel ? 'true' : 'false'); b.tabIndex = b.dataset.id === indSel ? 0 : -1; });
    const base = R.alt.base, a = R.alt[indSel], todos = ['base', 'a1', 'a2', 'a3'].map((i) => R.alt[i]);
    const corte = $('#livro-corpo');
    const existe = corte.children.length === IND.length;
    if (!existe) corte.innerHTML = IND.map((d, i) => '<div class="lv" role="row" data-i="' + i + '"></div>').join('');
    IND.forEach((d, i) => {
      const row = corte.children[i];
      const hoje = d.hoje(base);
      const vals = todos.map((x) => x[d.k]).filter((x) => x !== null && x !== undefined);
      const max = Math.max(...vals, hoje || 0, 0.0001);
      const va = a[d.k];
      const wh = hoje ? (hoje / max) * 100 : 0, wa = va ? (va / max) * 100 : 0;
      let vari = '';
      if (hoje && va !== null && d.menor && d.k !== 'payback_anos') vari = (va - hoje) / hoje * 100 <= 0 ? '−' + fmt(Math.abs((va - hoje) / hoje * 100), 0) + '%' : '+' + fmt((va - hoje) / hoje * 100, 0) + '%';
      const cor = 'var(' + COR[indSel] + ')';
      if (!row.dataset.pronto) {
        row.innerHTML =
          '<div class="lv__nome" role="cell"></div><div class="lv__v hoje" role="cell" data-r="Hoje"></div><div class="lv__v" role="cell" data-r="Com a alternativa"></div>' +
          '<div class="trilha" role="cell" aria-hidden="true"><i class="h"></i><i class="a"></i><span></span></div>';
        row.dataset.pronto = '1';
      }
      $('.lv__nome', row).innerHTML = d.nome + '<small>' + d.un + '</small>';
      $('.lv__v.hoje', row).textContent = hoje === null ? '—' : (d.moeda ? brl(hoje) : fmt(hoje, d.d));
      $$('.lv__v', row)[1].textContent = valorInd(d, a);
      const tri = $('.trilha', row);
      $('i.h', tri).style.width = wh + '%';
      const ia = $('i.a', tri);
      ia.style.width = wa + '%'; ia.style.setProperty('--cor', cor);
      $('span', tri).textContent = vari;
    });
    let nota = '';
    if (indSel === 'a2') nota = 'No solar autônomo, o payback simples é de ' + fmt(a.payback_anos, 1) + ' anos. Contando a troca das baterias a cada ' + fmt(a.vida_bateria_anos, 1) + ' anos (' + brl(a.troca_bateria) + ' por troca), o retorno sobe para ' + (a.payback_com_trocas ? fmt(a.payback_com_trocas, 0) + ' anos' : 'mais de 40 anos') + '. ';
    if (indSel === 'a3') nota = 'A participação renovável vem de créditos de um sistema solar externo à praça (' + fmt(P.fv_rede.kwp, 1) + ' kWp), não de geração dentro dela. ';
    nota += 'Emissões evitadas calculadas com o fator da rede de ' + fmt(P.geral.fator_emissao_kg_kwh, 4) + ' kg CO₂e/kWh. Projeções condicionadas às premissas da seção de referências.';
    $('#livro-nota').textContent = nota;
  }

  /* ============================================================
     DIAGNÓSTICO / CONSUMO
     ============================================================ */
  function renderConsumo() {
    const e = P.equipamentos, h = P.geral.horas_noite, dias = P.geral.dias_ano;
    const linhas = [e.caminho, e.quadra].map((g) => {
      const kw = g.qtd * g.sodio_w / 1000, kd = kw * h;
      return { g, kw, kd, km: kd * dias / 12, ka: kd * dias };
    });
    const tot = linhas.reduce((s, x) => ({ qtd: s.qtd + x.g.qtd, kw: s.kw + x.kw, kd: s.kd + x.kd, km: s.km + x.km, ka: s.ka + x.ka }), { qtd: 0, kw: 0, kd: 0, km: 0, ka: 0 });
    $('#t-eq tbody').innerHTML = linhas.map((x) =>
      '<tr><th scope="row">' + x.g.nome + '</th><td class="n">' + x.g.qtd + '</td><td class="n">' + fmt(x.g.sodio_w) + '</td><td class="n">' + fmt(x.kw, 3) + '</td><td class="n">' + fmt(h, 1) + '</td><td class="n">' + fmt(x.kd, 2) + '</td><td class="n">' + fmt(x.km, 1) + '</td><td class="n">' + fmt(x.ka) + '</td></tr>').join('');
    $('#t-eq tfoot').innerHTML = '<tr><th scope="row">Total</th><td class="n">' + tot.qtd + '</td><td class="n"></td><td class="n">' + fmt(tot.kw, 3) + '</td><td class="n"></td><td class="n">' + fmt(tot.kd, 2) + '</td><td class="n">' + fmt(tot.km, 1) + '</td><td class="n">' + fmt(tot.ka) + '</td></tr>';

    const b = R.alt.base;
    const c = $('#contas');
    c.innerHTML =
      '<div class="conta"><h4>Caminhos e bancos</h4><p>' + e.caminho.qtd + ' postes × ' + e.caminho.sodio_w + ' W = <b>' + fmt(e.caminho.qtd * e.caminho.sodio_w) + ' W</b>.<br>' + fmt(e.caminho.qtd * e.caminho.sodio_w) + ' W × ' + fmt(h, 1) + ' h / 1000 = <b>' + fmt(linhas[0].kd, 2) + ' kWh por noite</b>.</p></div>' +
      '<div class="conta"><h4>Quadra e playground</h4><p>' + e.quadra.qtd + ' postes × ' + e.quadra.sodio_w + ' W = <b>' + fmt(e.quadra.qtd * e.quadra.sodio_w) + ' W</b>.<br>' + fmt(e.quadra.qtd * e.quadra.sodio_w) + ' W × ' + fmt(h, 1) + ' h / 1000 = <b>' + fmt(linhas[1].kd, 2) + ' kWh por noite</b>.</p></div>' +
      '<div class="conta"><h4>Praça inteira</h4><p>' + fmt(linhas[0].kd, 2) + ' + ' + fmt(linhas[1].kd, 2) + ' = <b>' + fmt(tot.kd, 2) + ' kWh por noite</b>.<br>× ' + dias + ' noites = <b>' + fmt(tot.ka) + ' kWh por ano</b>, ou <b>' + fmt(tot.km) + ' kWh por mês</b>.</p></div>' +
      '<div class="conta"><h4>Custo e emissões</h4><p>' + fmt(tot.ka) + ' kWh × ' + brl(P.geral.tarifa_rs_kwh, 2) + ' + ' + brl(P.custos.om_base_ano) + ' de manutenção = <b>' + brl(b.custo_ano) + ' por ano</b>.<br>' + fmt(tot.ka) + ' kWh × ' + fmt(P.geral.fator_emissao_kg_kwh, 4) + ' kg = <b>' + fmt(b.kwh_ano * P.geral.fator_emissao_kg_kwh) + ' kg CO₂e por ano</b>.</p></div>';

    const g = raw.geral, ee = raw.equipamentos;
    $('#prem-consumo').innerHTML =
      '<li><b>' + fmt(h, 1) + ' h por noite.</b> ' + g.horas_noite.nota + '</li>' +
      '<li><b>Potência com reator.</b> ' + ee.caminho.sodio_nota + '. ' + ee.quadra.sodio_nota + '.</li>' +
      '<li><b>' + fmt(P.geral.fator_emissao_kg_kwh, 4) + ' kg CO₂e/kWh.</b> ' + g.fator_emissao_kg_kwh.nota + '</li>' +
      '<li><b>' + brl(P.geral.tarifa_rs_kwh, 2) + '/kWh.</b> ' + g.tarifa_rs_kwh.nota + '</li>';

    $$('[data-bind]').forEach((n) => {
      const k = n.dataset.bind;
      n.textContent = {
        base_kwh_noite: fmt(b.kwh_ano / dias, 1) + ' kWh',
        base_kwh_mes: fmt(b.kwh_mes) + ' kWh',
        base_rs_mes: brl(b.custo_ano / 12),
        base_co2: fmt(b.kwh_ano * P.geral.fator_emissao_kg_kwh) + ' kg CO₂e'
      }[k] || n.textContent;
    });
  }

  /* ============================================================
     ALTERNATIVAS
     ============================================================ */
  function cabCol(id, rec) {
    return '<th scope="col" class="n' + (rec ? ' rec' : '') + '"><span class="ponto" style="--c:var(' + COR[id] + ')"></span>' + NOMES[id] + (rec ? '<span class="sel-rec">Recomendada</span>' : '') + '</th>';
  }
  function linhaComp(nome, fn, opts) {
    opts = opts || {};
    return '<tr><th scope="row">' + nome + '</th>' + ['base', 'a1', 'a2', 'a3'].map((id) => '<td class="' + (opts.txt ? '' : 'n') + (id === 'a3' ? ' rec' : '') + '">' + fn(R.alt[id], id) + '</td>').join('') + '</tr>';
  }
  const pb = (a) => (a.payback_anos === null ? '—' : fmt(a.payback_anos, 1) + ' anos');

  function renderComparacao() {
    const A = R.alt;
    $('#t-comp thead').innerHTML = '<tr><th scope="col">Critério</th>' + ['base', 'a1', 'a2', 'a3'].map((id) => cabCol(id, id === 'a3')).join('') + '</tr>';
    $('#t-comp tbody').innerHTML =
      linhaComp('Dimensionamento', (a, id) => ({
        base: '20 lâmpadas de sódio, ' + fmt(a.potencia_kw, 2) + ' kW instalados',
        a1: '20 luminárias LED, ' + fmt(a.potencia_kw, 2) + ' kW, com controlador e sensor em cada poste',
        a2: fmt(a.pv_kwp, 1) + ' kWp de painéis e ' + fmt(a.bateria_kwh, 1) + ' kWh de bateria nos postes',
        a3: 'Alternativa 1 mais ' + fmt(a.fv_kwp, 1) + ' kWp de FV conectado à rede'
      }[id]), { txt: true }) +
      linhaComp('Consumo da rede (kWh/ano)', (a) => fmt(a.kwh_ano)) +
      linhaComp('Economia de energia', (a, id) => (id === 'base' ? '—' : fmt(a.economia_pct, 1) + '%')) +
      linhaComp('Participação renovável', (a) => fmt(a.renovavel_pct, 1) + '%') +
      linhaComp('Investimento inicial', (a) => (a.capex ? brl(a.capex) : '—')) +
      linhaComp('Custo anual de energia e manutenção', (a) => brl(a.custo_ano)) +
      linhaComp('Economia anual', (a, id) => (id === 'base' ? '—' : brl(a.economia_rs_ano))) +
      linhaComp('Retorno do investimento', (a, id) => pb(a) + (id === 'a2' ? '*' : '')) +
      linhaComp('Emissões evitadas (kg CO₂e/ano)', (a, id) => (id === 'base' ? '—' : fmt(a.co2_evitado_kg_ano)));
    $('#comp-nota').textContent = '* No solar autônomo, a troca das baterias a cada ' + fmt(A.a2.vida_bateria_anos, 1) + ' anos (' + brl(A.a2.troca_bateria) + ' por troca, com 60% do preço atual) leva o retorno a ' + (A.a2.payback_com_trocas ? fmt(A.a2.payback_com_trocas, 0) + ' anos' : 'mais de 40 anos') + '. Valores de investimento são estimativas de ordem de grandeza, sem orçamento comercial.';
  }

  function renderSensibilidade() {
    const tarifas = [0.6, 0.8, 1.0, 1.2];
    $('#t-sens thead').innerHTML = '<tr><th scope="col">Tarifa</th><th scope="col" class="n">LED + sensores</th><th scope="col" class="n">Solar autônomo</th><th scope="col" class="n">LED + sensores + FV</th></tr>';
    $('#t-sens tbody').innerHTML = tarifas.map((t) => {
      const p2 = clone(P); p2.geral.tarifa_rs_kwh = t;
      const r = M.calcular(p2).alt;
      const c = (a) => (a.payback_anos === null ? 'não retorna' : fmt(a.payback_anos, 1) + ' anos');
      const atual = Math.abs(t - P.geral.tarifa_rs_kwh) < 0.001;
      return '<tr><th scope="row">' + brl(t, 2) + '/kWh' + (atual ? ' (atual)' : '') + '</th><td class="n">' + c(r.a1) + '</td><td class="n">' + c(r.a2) + '</td><td class="n">' + c(r.a3) + '</td></tr>';
    }).join('');
  }

  function renderAchados() {
    const A = R.alt, d = R.decomp, base = A.base.kwh_ano;
    const melhor = ['a1', 'a2', 'a3'].filter((i) => A[i].payback_anos).sort((x, y) => A[x].payback_anos - A[y].payback_anos)[0];
    $('#achados').innerHTML =
      '<li><strong>A troca da lâmpada é onde está a maior parte do ganho.</strong> Só trocar o sódio por LED já reduz ' + fmt((d.troca_lampada_kwh / base) * 100, 1) + '% do consumo (' + fmt(d.troca_lampada_kwh) + ' kWh por ano). Dimerização e sensores acrescentam ' + fmt(d.dimerizacao_kwh) + ' kWh por ano.</li>' +
      '<li><strong>O solar autônomo é o menos vantajoso numa praça que já tem rede.</strong> Custa ' + fmt(A.a2.capex / A.a1.capex, 1) + ' vezes o LED com sensores e exige trocar baterias a cada ' + fmt(A.a2.vida_bateria_anos, 1) + ' anos. Ele faz mais sentido onde estender a rede é caro.</li>' +
      '<li><strong>A menor espera pelo retorno é de ' + NOMES[melhor] + ': ' + fmt(A[melhor].payback_anos, 1) + ' anos.</strong> A alternativa 3 combina eficiência e fonte renovável e chega a ' + fmt(A.a3.renovavel_pct, 0) + '% de participação renovável, por isso é a recomendada.</li>';
  }

  /* ---------- gráficos ---------- */
  const charts = {};
  function ajustarChartJS() {
    const C = window.Chart;
    C.defaults.font.family = '"Public Sans", system-ui, sans-serif';
    C.defaults.font.size = 12.5;
    C.defaults.color = '#4B5873';
    C.defaults.animation = reduzMov ? false : { duration: 350 };
    C.defaults.plugins.legend.labels.usePointStyle = true;
    C.defaults.plugins.legend.labels.boxWidth = 9;
    C.defaults.plugins.legend.labels.boxHeight = 9;
    C.defaults.plugins.tooltip.padding = 10;
    C.defaults.plugins.tooltip.backgroundColor = '#0F1B3D';
  }
  const rotulosPlugin = {
    id: 'rotulos',
    afterDatasetsDraw(chart, _a, opts) {
      if (!opts || !opts.textos) return;
      const { ctx } = chart; const meta = chart.getDatasetMeta(0);
      ctx.save(); ctx.font = '600 12.5px "Public Sans", sans-serif'; ctx.fillStyle = '#14203A'; ctx.textAlign = 'center';
      meta.data.forEach((bar, i) => { ctx.fillText(opts.textos[i], bar.x, bar.y - 7); });
      ctx.restore();
    }
  };

  function renderGraficos() {
    const anos = P.geral.horizonte_anos;
    const ac = M.custoAcumulado(R, anos);
    const dsC = [
      ['base', 'Sódio atual', ac.base, [], 3], ['a1', 'LED com sensores', ac.a1, [], 2.2],
      ['a2', 'Solar autônomo', ac.a2, [7, 5], 2.2], ['a3', 'LED com sensores e FV na rede', ac.a3, [], 3]
    ].map(([id, label, data, dash, w]) => ({ label, data, borderColor: css(COR[id]), backgroundColor: css(COR[id]), borderDash: dash, borderWidth: w, pointRadius: 0, pointHoverRadius: 5, tension: 0 }));
    if (!charts.custo) {
      charts.custo = new Chart($('#c-custo'), {
        type: 'line', data: { labels: ac.anos, datasets: dsC },
        options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          scales: {
            x: { title: { display: true, text: 'Anos' }, grid: { display: false } },
            y: { beginAtZero: true, title: { display: true, text: 'Custo acumulado (R$ mil)' }, ticks: { callback: (v) => fmt(v / 1000) }, grid: { color: '#E8ECF2' } }
          },
          plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { title: (it) => 'Ano ' + it[0].label, label: (c) => ' ' + c.dataset.label + ': ' + brl(c.parsed.y) } } }
        }
      });
    } else { charts.custo.data.labels = ac.anos; charts.custo.data.datasets.forEach((d, i) => { d.data = dsC[i].data; }); charts.custo.update('none'); }

    const d = R.decomp, A = R.alt;
    const b = A.base.kwh_ano, a1 = A.a1.kwh_ano, fin = A.a3.kwh_ano;
    const barras = [[0, b], [b - d.troca_lampada_kwh, b], [a1, b - d.troca_lampada_kwh], [fin, a1], [0, fin]];
    const textos = [fmt(b), '−' + fmt(d.troca_lampada_kwh), '−' + fmt(d.dimerizacao_kwh), '−' + fmt(a1 - fin), fmt(fin)];
    const cores = [css('--c-base'), css('--c-a1'), css('--c-a1'), css('--c-a2'), css('--c-a3')];
    if (!charts.cascata) {
      charts.cascata = new Chart($('#c-cascata'), {
        type: 'bar',
        data: { labels: [['Consumo', 'atual'], ['Troca', 'por LED'], ['Dimerização', 'e sensores'], ['Créditos', 'solares'], ['Consumo', 'final']], datasets: [{ data: barras, backgroundColor: cores, borderRadius: 4, borderSkipped: false, barPercentage: 0.7 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: { top: 24 } },
          scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false }}, y: { beginAtZero: true, title: { display: true, text: 'kWh por ano' }, ticks: { callback: (v) => fmt(v) }, grid: { color: '#E8ECF2' } } },
          plugins: { legend: { display: false }, rotulos: { textos }, tooltip: { callbacks: { label: (c) => ' ' + textos[c.dataIndex] + ' kWh por ano' } } }
        },
        plugins: [rotulosPlugin]
      });
    } else {
      const ch = charts.cascata; ch.data.datasets[0].data = barras; ch.options.plugins.rotulos.textos = textos; ch.options.plugins.tooltip.callbacks.label = (c) => ' ' + textos[c.dataIndex] + ' kWh por ano'; ch.update('none');
    }

    const serie = M.serieMensal(P, R);
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dsM = [
      { type: 'bar', label: 'Consumo do LED com sensores', data: serie.map((s) => s.a1), backgroundColor: css('--c-a1'), borderRadius: 3 },
      { type: 'bar', label: 'Créditos solares', data: serie.map((s) => s.fv), backgroundColor: css('--c-a2'), borderRadius: 3 },
      { type: 'line', label: 'Consumo restante da rede', data: serie.map((s) => s.a3), borderColor: css('--c-a3'), backgroundColor: css('--c-a3'), borderWidth: 3, pointRadius: 3, tension: 0.25 }
    ];
    if (!charts.mensal) {
      charts.mensal = new Chart($('#c-mensal'), {
        data: { labels: meses, datasets: dsM },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'kWh por mês' }, grid: { color: '#E8ECF2' } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + fmt(c.parsed.y, 0) + ' kWh' } } } }
      });
    } else { charts.mensal.data.datasets.forEach((s, i) => { s.data = dsM[i].data; }); charts.mensal.update('none'); }
  }

  /* ============================================================
     DIAGRAMA DE BLOCOS
     ============================================================ */
  const NOS = [
    { id: 'rede', x: 60, y: 30, w: 260, c: 'e', t: 'Rede elétrica', s: 'Concessionária, tarifa B4a', f: 'Fornece a energia que o sistema solar não cobre e recebe o excedente como crédito.', d: 'Consumo em kWh e tarifa em R$/kWh.', i: 'Consumo da rede (kWh/mês) e custo mensal.' },
    { id: 'fv', x: 640, y: 30, w: 260, c: 'e', t: 'Usina fotovoltaica', s: '3 kWp, prédio público próximo', f: 'Gera energia solar em um telhado público e a injeta na rede, formando créditos para a praça.', d: 'Geração mensal em kWh, simulada com sazonalidade de São Paulo.', i: 'Participação renovável (%) e emissões evitadas.' },
    { id: 'medidor', x: 350, y: 140, w: 260, c: 'e', t: 'Medidor bidirecional', s: 'Consumo e créditos', f: 'Mede a energia consumida da rede e a energia injetada, e faz o balanço entre as duas.', d: 'kWh consumidos, kWh injetados e saldo de créditos.', i: 'Consumo da rede e economia energética.' },
    { id: 'pc', x: 110, y: 260, w: 290, c: 'e', t: '14 postes de caminhos', s: 'LED de 45 W cada', f: 'Iluminam caminhos e bancos. Ficam em nível baixo de madrugada e sobem a 100% quando o sensor detecta alguém.', d: 'Potência instalada de 0,63 kW e consumo por hora.', i: 'Tempo de funcionamento eficiente (horas equivalentes a plena carga).' },
    { id: 'pq', x: 560, y: 260, w: 290, c: 'e', t: '6 postes de quadra e playground', s: 'LED de 100 W cada', f: 'Iluminam as áreas de maior uso, com potência maior, seguindo o mesmo perfil de dimerização.', d: 'Potência instalada de 0,60 kW e consumo por hora.', i: 'Tempo de funcionamento eficiente e consumo da rede.' },
    { id: 'sens', x: 40, y: 380, w: 230, c: 'd', t: 'Sensores nos postes', s: 'Presença, luz e consumo', f: 'Detectam presença e luminosidade e medem o consumo de cada poste.', d: 'Presença (sim ou não), lux e watts, lidos a cada intervalo.', i: 'Alimentam o perfil horário e a detecção de falhas.' },
    { id: 'ctrl', x: 365, y: 380, w: 230, c: 'd', t: 'Controlador do poste', s: 'Dimeriza o LED', f: 'Aplica a lógica de automação: nível 100%, 60% ou 30% conforme a hora, com reforço quando há presença.', d: 'Regra de dimerização e comandos de nível.', i: 'Define a economia energética obtida.' },
    { id: 'gate', x: 690, y: 380, w: 230, c: 'd', t: 'Gateway', s: 'Envia os dados', f: 'Reúne as leituras dos sensores e do medidor e as envia à base de dados.', d: 'Pacotes de leituras com data e hora.', i: 'Garante dados contínuos para os indicadores.' },
    { id: 'base', x: 690, y: 500, w: 230, c: 'd', t: 'Base de dados', s: 'Série por hora', f: 'Guarda o histórico de consumo, geração e comandos. No projeto, os dados são simulados.', d: 'Séries horárias e mensais.', i: 'Fonte de todos os gráficos.' },
    { id: 'motor', x: 100, y: 500, w: 300, c: 'd', t: 'Motor de cálculo', s: 'E = P×t/1000, R$ e CO₂e', f: 'Converte potência e horas em energia, e energia em custo, emissões e retorno do investimento.', d: 'Premissas do arquivo parametros.json e leituras da base.', i: 'Calcula os sete indicadores (js/model.js).' },
    { id: 'dash', x: 60, y: 620, w: 840, c: 'd', t: 'Neighborhood Action Dashboard', s: 'Sete indicadores para a comunidade', f: 'Apresenta indicadores, comparações e o simulador de premissas para a comunidade e para a prefeitura.', d: 'Resultados do motor de cálculo.', i: 'Consumo, economia, custo, renovável, emissões, horas eficientes e retorno.' }
  ];
  const LIN = [
    ['e', 'M190 90 V170 H348'], ['e', 'M770 90 V170 H612'], ['e', 'M430 200 V230 H255 V258'], ['e', 'M530 200 V230 H705 V258'],
    ['d', 'M155 380 V324'], ['d', 'M430 380 V350 H330 V324'], ['d', 'M530 380 V350 H640 V324'],
    ['d', 'M272 410 H363'], ['d', 'M597 410 H688'], ['d', 'M612 192 H940 V410 H922'],
    ['d', 'M805 440 V498'], ['d', 'M688 530 H402'], ['d', 'M250 560 V618']
  ];
  function montarDiagrama() {
    const gl = $('#diag-linhas'), gn = $('#diag-nos');
    LIN.forEach(([t, d]) => el('path', { d, fill: 'none', stroke: t === 'e' ? '#1E8A5E' : '#5B46B0', 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-dasharray': t === 'e' ? '' : '7 5', 'marker-end': t === 'e' ? 'url(#seta-e)' : 'url(#seta-d)' }, gl));
    NOS.forEach((n) => {
      const g = el('g', { class: 'dg-no dg-' + n.c, tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': n.t + '. ' + n.s, 'data-id': n.id }, gn);
      el('rect', { x: n.x, y: n.y, width: n.w, height: 60, rx: 10 }, g);
      const t = el('text', { x: n.x + n.w / 2, y: n.y + 26, 'text-anchor': 'middle', class: 'dg-t' }, g); t.textContent = n.t;
      const s = el('text', { x: n.x + n.w / 2, y: n.y + 46, 'text-anchor': 'middle', class: 'dg-s' }, g); s.textContent = n.s;
      const abrir = () => mostrarNo(n.id);
      g.addEventListener('click', abrir);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    });
    $('#diag-det').innerHTML = '<strong>Escolha um bloco</strong><p>Clique ou use Enter em qualquer bloco do diagrama para ver o que ele faz, quais dados usa e que indicador alimenta.</p>';
  }
  function mostrarNo(id) {
    const n = NOS.find((x) => x.id === id);
    $$('.dg-no').forEach((g) => g.setAttribute('aria-pressed', g.dataset.id === id ? 'true' : 'false'));
    $('#diag-det').innerHTML = '<strong>' + n.t + '</strong><p><span>Função:</span> ' + n.f + '</p><p><span>Dados:</span> ' + n.d + '</p><p><span>Indicadores:</span> ' + n.i + '</p>';
  }

  /* ============================================================
     SIMULADOR
     ============================================================ */
  const CTL = [
    { id: 's-tarifa', out: 'o-tarifa', get: () => raw.geral.tarifa_rs_kwh.valor, set: (v) => { raw.geral.tarifa_rs_kwh.valor = v; }, f: (v) => brl(v, 2) + '/kWh' },
    { id: 's-fe', out: 'o-fe', get: () => raw.geral.fator_emissao_kg_kwh.valor, set: (v) => { raw.geral.fator_emissao_kg_kwh.valor = v; }, f: (v) => fmt(v, 4) + ' kg CO₂e/kWh' },
    { id: 's-horas', out: 'o-horas', get: () => raw.geral.horas_noite.valor, set: (v) => { raw.geral.horas_noite.valor = v; }, f: (v) => fmt(v, 1) + ' h' },
    { id: 's-kwp', out: 'o-kwp', get: () => raw.fv_rede.kwp.valor, set: (v) => { raw.fv_rede.kwp.valor = v; }, f: (v) => fmt(v, 1) + ' kWp' },
    { id: 's-pres', out: 'o-pres', get: () => raw.dimerizacao.reforco_presenca.valor, set: (v) => { raw.dimerizacao.reforco_presenca.valor = v; }, f: (v) => fmt(v * 100, 0) + '%' },
    { id: 's-bat', out: 'o-bat', get: () => raw.custos.bateria_rs_kwh.valor, set: (v) => { raw.custos.bateria_rs_kwh.valor = v; }, f: (v) => brl(v) + '/kWh' }
  ];
  function sincronizarControles() {
    CTL.forEach((c) => { const i = document.getElementById(c.id); i.value = c.get(); document.getElementById(c.out).textContent = c.f(c.get()); });
  }
  function iniciarSimulador() {
    let pend = false;
    CTL.forEach((c) => {
      const i = document.getElementById(c.id);
      i.addEventListener('input', () => {
        c.set(parseFloat(i.value));
        document.getElementById(c.out).textContent = c.f(parseFloat(i.value));
        if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; recalcular(); }); }
      });
    });
    $$('.atalhos button').forEach((b) => b.addEventListener('click', () => { raw.geral.fator_emissao_kg_kwh.valor = parseFloat(b.dataset.fe); sincronizarControles(); recalcular(); }));
    $('#restaurar').addEventListener('click', () => { raw = clone(DEFAULT); sincronizarControles(); recalcular(); });
    $('#sim-form').addEventListener('submit', (e) => e.preventDefault());
    sincronizarControles();
  }
  function renderMatriz() {
    $('#t-matriz thead').innerHTML = '<tr><th scope="col">Indicador</th>' + ['base', 'a1', 'a2', 'a3'].map((id) => cabCol(id, id === 'a3')).join('') + '</tr>';
    const linha = (nome, un, fn) => '<tr><th scope="row">' + nome + '<span class="sel-rec" style="color:var(--tinta-2)">' + un + '</span></th>' + ['base', 'a1', 'a2', 'a3'].map((id) => '<td class="n' + (id === 'a3' ? ' rec' : '') + '">' + fn(R.alt[id], id) + '</td>').join('') + '</tr>';
    $('#t-matriz tbody').innerHTML =
      linha('Consumo de energia', 'kWh/mês', (a) => fmt(a.kwh_mes)) +
      linha('Economia energética', '%', (a, id) => (id === 'base' ? '—' : fmt(a.economia_pct, 1))) +
      linha('Redução de custos', 'R$/mês', (a, id) => (id === 'base' ? '—' : fmt(a.reducao_rs_mes))) +
      linha('Participação renovável', '%', (a) => fmt(a.renovavel_pct, 1)) +
      linha('Emissões evitadas', 'kg CO₂e/ano', (a, id) => (id === 'base' ? '—' : fmt(a.co2_evitado_kg_ano))) +
      linha('Funcionamento eficiente', 'horas/dia equivalentes', (a) => fmt(a.horas_eficientes, 1)) +
      linha('Retorno do investimento', 'anos', (a, id) => (a.payback_anos === null ? '—' : fmt(a.payback_anos, 1)));
  }

  /* ============================================================
     PREMISSAS
     ============================================================ */
  function renderPremissas() {
    const tag = (t) => '<span class="tag ' + ({ dado: 'tag--dado', estimativa: 'tag--est', simulado: 'tag--sim' }[t] || 'tag--est') + '">' + t + '</span>';
    const linhas = [];
    const e = raw.equipamentos;
    [e.caminho, e.quadra].forEach((g) => {
      linhas.push([g.nome, g.qtd + ' postes: sódio ' + g.sodio_w + ' W, LED ' + g.led_w + ' W', 'estimativa', g.sodio_nota + '. ' + g.led_nota + '.']);
    });
    linhas.push(['Perfil de dimerização', '100% das 18h às 22h, 60% das 22h às 24h, 30% de 0h às 5h, 60% de 5h às 6h', 'estimativa', 'Perfil assumido pelo grupo. Um sensor de presença reforça a 100% parte do tempo dimerizado.']);
    const num = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
    const valor = (it) => {
      if (Array.isArray(it.valor)) return '12 fatores mensais';
      const n = num(it.valor), u = it.unidade || '';
      return u.indexOf('R$') === 0 ? u.replace('R$', 'R$ ' + n) : n + (u ? ' ' + u : '');
    };
    ['geral', 'custos', 'solar_autonomo', 'fv_rede'].forEach((g) => {
      Object.keys(raw[g]).forEach((k) => {
        const it = raw[g][k];
        linhas.push([it.rotulo, valor(it), it.tipo, it.nota || '']);
      });
    });
    const dm = raw.dimerizacao;
    linhas.push([dm.reforco_presenca.rotulo, fmt(dm.reforco_presenca.valor * 100, 0) + '% do tempo dimerizado', dm.reforco_presenca.tipo, dm.reforco_presenca.nota]);
    linhas.push([dm.standby_w.rotulo, fmt(dm.standby_w.valor) + ' W', dm.standby_w.tipo, dm.standby_w.nota]);
    $('#t-prem tbody').innerHTML = linhas.map((l) => '<tr><th scope="row">' + l[0] + '</th><td>' + l[1] + '</td><td>' + tag(l[2]) + '</td><td>' + l[3] + '</td></tr>').join('');
  }

  /* ============================================================ */
  function renderTudo() {
    renderConsumo(); renderLivro(); renderComparacao(); renderSensibilidade(); renderAchados();
    renderGraficos(); renderMatriz(); renderPremissas(); atualizarMapa();
  }
  function iniciar() {
    ajustarChartJS();
    montarAbas(); montarDiagrama(); iniciarMapa(); iniciarSimulador();
    $('#hora').style.setProperty('--polegar', css(COR.base));
    recalcular();
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
