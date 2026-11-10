# Roteiro do vídeo técnico (máximo 3 minutos)

Vídeo **não listado** no YouTube. Narração em ritmo normal (cerca de 2,4 palavras por segundo). O roteiro tem ~395 palavras de narração, o que dá ~2min45s e deixa pouca folga: a cena 2 tem uma frase marcada como (opcional) para cortar se necessário.

## Antes de gravar

- Abrir o site (GitHub Pages) em tela cheia, janela de 1280 px de largura ou mais, e rolar até o topo.
- Deixar o simulador nas premissas originais (botão "Restaurar premissas originais").
- Selecionar "Sódio atual" e a hora 20h no mapa.
- Ensaiar uma vez com cronômetro. Se passar de 2min50s, cortar a frase marcada com (opcional) e não ler a marcação em voz alta.

## Cena 1: o espaço e o problema (0:00 a 0:22)

**Na tela:** topo do site, mapa da praça com os 20 postes acesos em âmbar. Passar o controle de hora de 18h até 5h: o brilho não muda.

**Narração:**
"Esta é uma praça comunitária modelo, com vinte postes de vapor de sódio. Eles ficam acesos em potência total das seis da tarde às seis da manhã, mesmo de madrugada, quando quase ninguém circula. Ninguém mede o consumo de cada poste, e quem paga é a prefeitura."

## Cena 2: a análise de consumo (0:22 a 0:55)

**Na tela:** rolar até a seção "Consumo". Mostrar a tabela e os quatro cartões de conta.

**Narração:**
"Para estimar o consumo, usamos energia igual a potência vezes tempo, dividido por mil. São catorze postes de oitenta e três watts e seis de cento e setenta, ligados doze horas por noite. Dá vinte e seis quilowatts-hora por noite, cerca de oitocentos por mês, e nove mil quinhentos e cinquenta e sete por ano. Isso custa oito mil e quinhentos reais por ano e emite trezentos e sessenta e oito quilos de CO₂. As premissas têm fonte, e o que é estimativa está marcado como estimativa. (opcional)"

## Cena 3: a comparação das alternativas (0:55 a 1:35)

**Na tela:** seção "Alternativas". Mostrar a tabela comparativa, depois o gráfico de custo acumulado e o gráfico em cascata.

**Narração:**
"Comparamos três melhorias para a mesma necessidade de iluminação. A primeira troca o sódio por LED, com dimerização e sensores de presença: o consumo cai sessenta por cento. A segunda é um poste solar autônomo, com painel e bateria. Ele zera o consumo da rede, mas custa mais de cem mil reais e precisa trocar a bateria a cada cinco anos e meio. A terceira junta a primeira com créditos de um sistema fotovoltaico de três quilowatts-pico. Ela reduz o consumo em noventa e seis por cento, tem oitenta e nove por cento de energia renovável e o menor retorno: sete anos."

## Cena 4: o diagrama (1:35 a 2:00)

**Na tela:** seção "Diagrama". Clicar em "Sensores nos postes", depois em "Controlador do poste" e em "Motor de cálculo".

**Narração:**
"Este é o diagrama da solução. A energia vem da rede e da usina solar, passa pelo medidor bidirecional e chega aos postes. Sensores de presença e luz alimentam o controlador, que dimeriza o LED. Um gateway envia os dados para a base, o motor de cálculo transforma tudo em indicadores, e o dashboard mostra o resultado."

## Cena 5: os indicadores no dashboard (2:00 a 2:35)

**Na tela:** voltar à seção "Visão geral" e escolher a alternativa recomendada. Depois ir ao "Simulador" e arrastar a tarifa de R$ 0,80 para R$ 1,20, mostrando a tabela atualizar.

**Narração:**
"No dashboard, sete indicadores: consumo, economia, redução de custo, participação renovável, emissões evitadas, tempo de funcionamento eficiente e retorno do investimento. Todos saem do mesmo modelo de cálculo. No simulador, se a tarifa sobe de oitenta centavos para um real e vinte, o retorno da alternativa recomendada cai de sete para menos de cinco anos."

## Cena 6: benefícios e limitações (2:35 a 2:52)

**Na tela:** seção "Referências e limitações", rolando devagar pela lista de limitações.

**Narração:**
"Os benefícios esperados são menos gasto público, mais energia renovável e dados abertos para a comunidade. Mas são projeções: a praça é um modelo, os custos são estimativas e a tarifa precisa ser confirmada. A redução de CO₂ é pequena, porque a matriz elétrica brasileira já é limpa. Obrigado."

## Conferência dos números citados

Todos vêm de `data/parametros.json` e de `js/model.js` (rode `node tools/testar-modelo.js`).

| Fala | Valor no modelo |
|---|---|
| 14 postes de 83 W e 6 de 170 W | 14 × 83 W e 6 × 170 W |
| 26 kWh por noite | 26,18 kWh |
| cerca de 800 kWh por mês | 796,4 kWh |
| 9.557 kWh por ano | 9.557 kWh |
| R$ 8.500 por ano | R$ 8.546 |
| 368 kg de CO₂ | 368 kg CO₂e por ano (fator de 2023) |
| consumo cai 60% (Alt. 1) | 60,6% |
| solar autônomo: mais de R$ 100 mil | R$ 101.606 |
| bateria a cada 5,5 anos | 5,5 anos (2.000 ciclos) |
| Alt. 3: 96% menos consumo, 89% renovável, 7 anos | 95,6%, 88,9%, 7,2 anos |
| tarifa de R$ 1,20: retorno abaixo de 5 anos | 4,9 anos |
