/*
 * Modelo de cálculo energético da Praça Comunitária Modelo (SERS, Global Solution 2026.2).
 * Todo número exibido no site vem daqui. Sem dependências: roda no navegador e no Node.
 * Energia: E (kWh) = P (W) × t (h) / 1000.
 */
(function (root) {
  'use strict';

  const v = (p) => (p && typeof p === 'object' && 'valor' in p ? p.valor : p);

  // Constrói um objeto plano de valores a partir do JSON de parâmetros (com 'valor', 'tipo', 'nota').
  function achatar(par) {
    const out = {};
    for (const grupo of ['geral', 'custos', 'solar_autonomo', 'fv_rede']) {
      out[grupo] = {};
      for (const k of Object.keys(par[grupo])) out[grupo][k] = v(par[grupo][k]);
    }
    out.equipamentos = par.equipamentos;
    out.dimerizacao = {
      perfil: par.dimerizacao.perfil,
      reforco_presenca: v(par.dimerizacao.reforco_presenca),
      standby_w: v(par.dimerizacao.standby_w)
    };
    return out;
  }

  // Nível de dimerização por hora do relógio (18..23, 0..5), com reforço por presença.
  function niveisPorHora(p) {
    const horas = [];
    for (let h = 18; h < 30; h++) {
      const hc = h % 24;
      const faixa = p.dimerizacao.perfil.find((f) => {
        const ate = f.ate === 24 ? 24 : f.ate;
        return hc >= f.de && hc < ate;
      });
      const nivel = faixa ? faixa.nivel : 1;
      const efetivo = nivel >= 1 ? 1 : nivel + p.dimerizacao.reforco_presenca * (1 - nivel);
      horas.push({ hora: hc, nivel, efetivo });
    }
    return horas;
  }

  function horasEquivalentes(p) {
    return niveisPorHora(p).reduce((s, x) => s + x.efetivo, 0);
  }

  function potencias(p) {
    const e = p.equipamentos;
    const g = [e.caminho, e.quadra];
    const sodio_kw = g.reduce((s, x) => s + x.qtd * x.sodio_w, 0) / 1000;
    const led_kw = g.reduce((s, x) => s + x.qtd * x.led_w, 0) / 1000;
    const postes = g.reduce((s, x) => s + x.qtd, 0);
    return { sodio_kw, led_kw, postes };
  }

  function calcular(p) {
    const G = p.geral, C = p.custos, S = p.solar_autonomo, F = p.fv_rede, E = p.equipamentos;
    const { sodio_kw, led_kw, postes } = potencias(p);
    const dias = G.dias_ano, horas = G.horas_noite, tar = G.tarifa_rs_kwh, fe = G.fator_emissao_kg_kwh;
    // O perfil de dimerização é definido para 12 h; se a noite tiver outra duração, escala proporcionalmente.
    const heq = horasEquivalentes(p) * (horas / 12);

    // ---- Linha de base: sódio, potência total durante toda a noite
    const base_kwh = sodio_kw * horas * dias;
    const base_om = C.om_base_ano;
    const base_custo = base_kwh * tar + base_om;

    // ---- Alt. 1: LED + dimerização + sensores
    const standby_kwh = postes * (p.dimerizacao.standby_w / 1000) * horas * dias;
    const a1_kwh = led_kw * heq * dias + standby_kwh;
    const a1_capex = E.caminho.qtd * C.luminaria_ornamental_led + E.quadra.qtd * C.projetor_led +
      postes * (C.controlador_luminaria + C.sensor_presenca + C.instalacao_por_poste) + C.gateway;
    const a1_custo = a1_kwh * tar + C.om_led_ano;

    // ---- Alt. 2: LED solar autônomo (sem rede)
    const diaria = (w) => (w * heq) / 1000 + (p.dimerizacao.standby_w / 1000) * horas; // kWh/dia por poste
    const dia_c = diaria(E.caminho.led_w), dia_q = diaria(E.quadra.led_w);
    const wp = (dia) => Math.ceil((dia / (S.horas_sol_pleno * S.eficiencia_sistema)) * 1000 / S.passo_painel_wp) * S.passo_painel_wp;
    const wp_c = wp(dia_c), wp_q = wp(dia_q);
    const pv_wp_total = E.caminho.qtd * wp_c + E.quadra.qtd * wp_q;
    const bateria_kwh = (E.caminho.qtd * dia_c + E.quadra.qtd * dia_q) * S.autonomia_dias / S.profundidade_descarga;
    const a2_capex = E.caminho.qtd * C.luminaria_ornamental_led + E.quadra.qtd * C.projetor_led +
      pv_wp_total * C.painel_autonomo_rs_wp + bateria_kwh * C.bateria_rs_kwh +
      postes * (C.controlador_carga_solar + C.instalacao_por_poste);
    const a2_custo = C.om_autonomo_ano;
    const troca_bateria = bateria_kwh * C.bateria_rs_kwh * C.troca_bateria_fator;
    const vida_bateria_anos = S.ciclos_bateria / dias;

    // ---- Alt. 3: Alt. 1 + FV conectado à rede (créditos)
    const fv_ger = F.kwp * F.rendimento_kwh_kwp_ano;
    const fv_comp = fv_ger * F.aproveitamento_compensacao;
    const a3_kwh = Math.max(a1_kwh - fv_comp, 0);
    const a3_capex = a1_capex + F.kwp * 1000 * C.fv_rede_rs_wp;
    const a3_om = C.om_led_ano + F.kwp * C.om_fv_rs_kwp_ano;
    const a3_custo = a3_kwh * tar + a3_om;
    const a3_ren = Math.min(fv_comp / a1_kwh, 1) * 100;

    function ind(id, nome, kwh, capex, custo, ren, heff, extra) {
      const eco_ano = base_custo - custo;
      return Object.assign({
        id, nome,
        kwh_mes: kwh / 12,
        kwh_ano: kwh,
        economia_pct: (1 - kwh / base_kwh) * 100,
        reducao_rs_mes: eco_ano / 12,
        economia_rs_ano: eco_ano,
        renovavel_pct: ren,
        co2_evitado_kg_ano: (base_kwh - kwh) * fe,
        horas_eficientes: heff,
        capex,
        custo_ano: custo,
        payback_anos: capex > 0 && eco_ano > 0 ? capex / eco_ano : null
      }, extra || {});
    }

    const alt = {
      base: ind('base', 'Sódio atual', base_kwh, 0, base_custo, 0, horas, { potencia_kw: sodio_kw }),
      a1: ind('a1', 'LED + sensores', a1_kwh, a1_capex, a1_custo, 0, heq, { potencia_kw: led_kw }),
      a2: ind('a2', 'LED solar autônomo', 0, a2_capex, a2_custo, 100, heq, {
        potencia_kw: led_kw, pv_kwp: pv_wp_total / 1000, bateria_kwh, troca_bateria, vida_bateria_anos
      }),
      a3: ind('a3', 'LED + sensores + FV na rede', a3_kwh, a3_capex, a3_custo, a3_ren, heq, {
        potencia_kw: led_kw, fv_kwp: F.kwp, fv_gerado_kwh: fv_ger, fv_compensado_kwh: fv_comp
      })
    };

    // Payback do solar autônomo contando as trocas de bateria (passo de 0,05 ano até 40 anos)
    {
      const a = alt.a2, eco = base_custo - a2_custo;
      let t = null;
      for (let y = 0.05; y <= 40; y += 0.05) {
        const trocas = Math.floor(y / vida_bateria_anos);
        if (base_custo * y >= a2_capex + a2_custo * y + trocas * troca_bateria) { t = y; break; }
      }
      a.payback_com_trocas = t;
      a.economia_rs_ano_bruta = eco;
    }

    // Decomposição do ganho da Alt. 1 (troca de lâmpada vs. dimerização/sensores)
    const led_so_kwh = led_kw * horas * dias;
    const decomp = {
      troca_lampada_kwh: base_kwh - led_so_kwh,
      dimerizacao_kwh: led_so_kwh - a1_kwh
    };

    return { alt, base_kwh, base_custo, heq, potencias: { sodio_kw, led_kw, postes }, decomp,
      dim: { caminho_wh_dia: dia_c * 1000, quadra_wh_dia: dia_q * 1000, wp_caminho: wp_c, wp_quadra: wp_q } };
  }

  // Potência instantânea (kW) por hora da noite, por alternativa. 12 pontos: 18h..05h.
  function perfilHorario(p) {
    const { sodio_kw } = potencias(p);
    const e = p.equipamentos, sb = p.dimerizacao.standby_w / 1000;
    const postes = e.caminho.qtd + e.quadra.qtd;
    return niveisPorHora(p).map((n) => {
      const led = (e.caminho.qtd * e.caminho.led_w + e.quadra.qtd * e.quadra.led_w) / 1000 * n.efetivo + postes * sb;
      return { hora: n.hora, nivel: n.nivel, efetivo: n.efetivo, base_kw: sodio_kw, led_kw: led };
    });
  }

  // Série mensal simulada: consumo da rede (kWh) e geração FV (kWh) com sazonalidade normalizada.
  function serieMensal(p, res) {
    const s = p.fv_rede.sazonalidade_mensal;
    const media = s.reduce((a, b) => a + b, 0) / s.length;
    const dias = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return s.map((f, i) => {
      const ger = (p.fv_rede.kwp * p.fv_rede.rendimento_kwh_kwp_ano * (f / media)) * dias[i] / 365;
      const comp = ger * p.fv_rede.aproveitamento_compensacao;
      const base = res.base_kwh * dias[i] / 365;
      const a1 = res.alt.a1.kwh_ano * dias[i] / 365;
      return { mes: i, base, a1, fv: comp, a3: Math.max(a1 - comp, 0) };
    });
  }

  // Custo acumulado (R$) ao longo dos anos, por alternativa; Alt. 2 inclui trocas de bateria.
  function custoAcumulado(res, anos) {
    const out = { anos: [], base: [], a1: [], a2: [], a3: [] };
    const A = res.alt;
    for (let y = 0; y <= anos; y++) {
      out.anos.push(y);
      out.base.push(A.base.custo_ano * y);
      out.a1.push(A.a1.capex + A.a1.custo_ano * y);
      const tr = Math.floor(y / A.a2.vida_bateria_anos);
      out.a2.push(A.a2.capex + A.a2.custo_ano * y + tr * A.a2.troca_bateria);
      out.a3.push(A.a3.capex + A.a3.custo_ano * y);
    }
    return out;
  }

  const api = { achatar, niveisPorHora, horasEquivalentes, potencias, calcular, perfilHorario, serieMensal, custoAcumulado };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PracaModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
