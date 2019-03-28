const downloadWrapper = document.getElementById('download');
const uploadWrapper = document.getElementById('upload');
const filterRow = document.getElementById('filter');
const checkboxes = document.querySelectorAll("#filter input[checked='checked']");
const navMenu = document.querySelector('.nav-wrapper ul');
const sideNav = document.querySelector('ul.sidenav');
const refSortArray = ["Tutorial", "Arctic", "Desert", "Forest", "Volcano", "Boss"];
let filteredJsons = [];
let jsons = [];
let gridCharts = true;
let checkboxStatus = {};
let dropID = 0;

var chartsColors = [
  "#9e0202",
  "#ff9400",
  "#60ad01",
  "#01ad96",
  "#0056d8",
  "#6f39f9",
  "#91039e",
];

function init() {

  // bind function to filter checkboxes
  Array.from(checkboxes).map(checkbox => {
    checkboxStatus[checkbox.value] = true;
    checkbox.addEventListener("change", e => {
      checkboxStatus[e.target.value] = !checkboxStatus[e.target.value];
      filterJsons();
    })
  });

  // readJSONLocal();
}

function uploadLogs(e) {
  // stop button pulsing
  uploadWrapper.querySelector('a').classList.remove("pulse");

  readJSONs(e);
}

function readJSONs(evt) {

  clearJsons();

  let files = evt.target.files; // FileList object
  let countReads = 0;

  // Loop through the FileList
  for (let i = 0; i < files.length; i++) {
    read(files[i]);
  }

  function read(file) {
    // Only process json files.
    if (!file.type.match('application/json')) {
      return;
    }

    countReads++;
    let reader = new FileReader();

    reader.onload = function () {
      let json = JSON.parse(reader.result);
      json.fileName = file.name;
      jsons.push(json);
      if (jsons.length >= countReads) {
        filterJsons();
      }
    };

    // Read
    reader.readAsText(file);
  }
}

function clearSections() {
  // clear previous data
  let sections = document.querySelectorAll(".chartsSection");
  for (let i = 0; i < sections.length; i++) {
    sections[i].parentNode.removeChild(sections[i]);
  }

  // clear navbar
  while (navMenu.firstChild) {
    navMenu.removeChild(navMenu.firstChild);
  }
  while (sideNav.firstChild) {
    sideNav.removeChild(sideNav.firstChild);
  }
}

function clearJsons() {
  // clear jsons
  jsons.length = 0;
  filteredJsons.length = 0;

  // shuffle colors
  chartsColors.sort(() => 0.5 - Math.random());
}

function displayData() {

  let analiseQuedas = insertSection(`Quedas`);
  displayQuedas(analiseQuedas);
  displayQuedasVulcao(analiseQuedas);
  displayPrimeiraQueda(analiseQuedas);
  displayMediaPrimeiraQueda(analiseQuedas);
  displayMenorTempoDeQueda(analiseQuedas);
  let analiseResultados = insertSection(`Resultados`);
  displayResultados(analiseResultados);
  displayVitoriasDerrotas(analiseResultados);
  displayTentativas(analiseResultados);
  let analiseComportamento = insertSection(`Comportamento`);
  displayTempoJogo(analiseComportamento);
  displayEnergia(analiseComportamento);
  displayPowerups(analiseComportamento);
  let analisePerformance = insertSection(`Performance`);
  displayMainScoreMaisAlto(analisePerformance)
  displayNotas(analisePerformance);
  displayMediaNotas(analisePerformance);
  displayPortalGap(analisePerformance);
  displayMediaPortalGap(analisePerformance);

  updateScrollSpy();
  updateSideNav();
  updateDropdowns();

  function displayQuedas(section) {
    const subsection = insertSubsection(section, "Quedas", "Quantidade total de quedas em cada partida");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];
      const canvas = canvases[i];

      var datasets = [
        {
          label: logFile.fileName,
          data: logFile.logEntries.map(log => log.stats.falls),
          fill: false,
          borderColor: getChartColor(i),
          xAxisID: 'xAxis'
        }
      ]
      var labels = logFile.logEntries.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotLinear(canvas, datasets, labels);
    }
  }

  function displayQuedasVulcao(section) {
    const subsection = insertSubsection(section, "Quedas Vulcão", "Quantidade média de quedas em cada fase do vulcão");
    const canvases = insertCharts(subsection, 1, false);

    const canvas = canvases[0];
    let datasets = [];
    let stages = [1, 2, 3, 4];

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];

      let data = [];
      let volcano_stages = logFile.logEntries.filter(item => item.levelInfo.world == "Volcano");

      for (let j = 0; j < stages.length; j++) {
        let stages_subset = volcano_stages.filter(item => item.levelInfo.level == stages[j]).map(item => item.stats.falls);
        if (stages_subset.length > 0) {
          let sum = stages_subset.reduce(function (a, b) { return a + b; });
          data.push(sum / stages_subset.length);
        } else {
          data.push(null);
        }
      }

      var labels = stages.map(stage => "Volcano" + "_" + stage);
      datasets.push(
        {
          label: logFile.fileName,
          data: data,
          fill: false,
          borderColor: getChartColor(i),
          xAxisID: 'xAxis'
        }
      );
    }
    plotLinear(canvas, datasets, labels);
  }

  function displayPrimeiraQueda(section) {
    const subsection = insertSubsection(section, "Primeira Queda", "Tempo decorrido até a primeira queda em cada partida");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];
      const canvas = canvases[i];

      var datasets = [
        {
          label: logFile.fileName,
          data: logFile.logEntries.map(log => {
            if (log.fallsTimes.length > 0) {
              return log.fallsTimes[0]
            } else {
              return null;
            }
          }),
          fill: false,
          borderColor: getChartColor(i),
          xAxisID: 'xAxis'
        }
      ]
      var labels = logFile.logEntries.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotLinear(canvas, datasets, labels);
    }
  }

  function displayMediaPrimeiraQueda(section) {
    const subsection = insertSubsection(section, "Média Primeira Queda", "Média do tempo da primeira queda em cada fase");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      const sortedLogEntries = [...logFile.logEntries].sort(sortLogFile);

      let infos = sortedLogEntries.reduce((acc, cur) => {
        let newitem = { world: cur.levelInfo.world, level: cur.levelInfo.level };
        if (!acc.includes(newitem)) {
          if (cur.fallsTimes.length != 0)
            acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, firstfall: cur.fallsTimes[0] });
        }
        return acc;
      }, []);

      let stages = [...new Set(infos.map(info => info.key))];
      let data = stages.map(stage => {
        return infos.filter(info => info.key == stage).reduce((total, current, index, array) => {
          total += current.firstfall;
          if (index === array.length - 1) {
            return total / array.length;
          } else {
            return total;
          }
        }, 0);
      })

      let datasets = [
        {
          label: logFile.fileName,
          data: data,
          fill: false,
          borderColor: getChartColor(i),
          xAxisID: 'xAxis'
        }
      ];
      plotLinear(canvas, datasets, stages);
    }
  };

  function displayMenorTempoDeQueda(section) {
    const subsection = insertSubsection(section, "Menor Tempo Queda", "Menor tempo decorrido até a primeira queda em cada fase");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      const sortedLogEntries = [...logFile.logEntries].sort(sortLogFile);

      let infos = sortedLogEntries.reduce((acc, cur) => {
        let newitem = { world: cur.levelInfo.world, level: cur.levelInfo.level };
        if (!acc.includes(newitem)) {
          if (cur.fallsTimes.length != 0)
            acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, fallsTimes: cur.fallsTimes });
        }
        return acc;
      }, []);

      let stages = [...new Set(infos.map(info => info.key))];
      let data = stages.map(stage => {
        let stageInfos = infos.filter(info => info.key == stage);
        let stageFallsTimes = stageInfos.reduce((acc, cur) => {
          acc.push(...cur.fallsTimes.filter(time => time >= 0));
          return acc
        }, []);
        let fastestFall = Math.min(...stageFallsTimes).toFixed(1);
        return fastestFall;
      })

      let datasets = [
        {
          label: logFile.fileName,
          data: data,
          fill: false,
          backgroundColor: stages.map((stage, index) => getChartColor(index)),
        }
      ];
      plotPolarArea(canvas, datasets, stages, logFile.fileName);
    }
  }

  function displayResultados(section) {
    const subsection = insertSubsection(section, "Resultados", "Resultados combinados das partidas em cada fase");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];
      const canvas = canvases[i];
      const sortedLogEntries = [...logFile.logEntries].sort(sortLogFile);

      let infos = sortedLogEntries.reduce((acc, cur) => {
        let newitem = { world: cur.levelInfo.world, level: cur.levelInfo.level };
        if (!acc.includes(newitem)) {
          acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, levelResult: cur.levelResult });
        }
        return acc;
      }, []);

      let dataWin = [];
      let dataLose = [];
      let dataAbort = [];
      let stages = [...new Set(infos.map(info => info.key))];
      stages.map(stage => {
        dataWin.push(infos.filter(info => { return info.key == stage && info.levelResult == "win" }).length);
        dataLose.push(infos.filter(info => { return info.key == stage && info.levelResult == "lose" }).length);
        dataAbort.push(infos.filter(info => { return info.key == stage && (info.levelResult != "win" && info.levelResult != "lose") }).length);
      });
      console.log({dataWin});
      let datasets = [
        {
          label: "Vitórias",
          data: dataWin,
          fill: true,
          backgroundColor: "green",
        },
        {
          label: "Derrotas",
          data: dataLose,
          fill: true,
          backgroundColor: "red",
        },
        {
          label: "Abortagens",
          data: dataAbort,
          fill: true,
          backgroundColor: "yellow",
        }
      ];

      let chart = plotBar(canvas, datasets, stages, logFile.fileName, null, 1.5);
    }
  }

  function displayVitoriasDerrotas(section) {
    const subsection = insertSubsection(section, "Vitórias", "Resultado de cada partida, considerando partidas finalizadas");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];
      const canvas = canvases[i];
      const endedLogs = logFile.logEntries.filter(log => log.levelResult == 'win' || log.levelResult == 'lose')

      var datasets = [
        {
          label: logFile.fileName,
          data: endedLogs.map(log => {
            if (log.levelResult == 'win') return 1;
            else return 0;
          }),
          fill: false,
          borderColor: getChartColor(i),
          xAxisID: 'xAxis'
        }
      ]
      let labels = endedLogs.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      let yAxesCallback = function (label, index, labels) {
        if (label == 1) return "Vitória";
        else if (label == 0) return "Derrota";
      }

      let chart = plotLinear(canvas, datasets, labels, null, yAxesCallback, 3);
    }
  }

  function displayTentativas(section) {
    const subsection = insertSubsection(section, "Tentativas Para Ganhar", "Número de vezes que jogou uma fase até ganhar a primeira vez");
    const canvases = insertCharts(subsection, 1, false);

    const labels = [...new Set(filteredJsons.reduce((acc, cur) => {
      acc = acc.concat(cur.logEntries);
      return acc;
    }, []).sort(sortLogFile).map(log => log.levelInfo.world + "_" + log.levelInfo.level))];
    let datasets = [];

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];

      let data = [];
      for (let j = 0; j < labels.length; j++) {
        const label = labels[j];
        let filtered = logFile.logEntries.filter(log => (log.levelInfo.world + "_" + log.levelInfo.level) == label);
        let tries = 0;
        let won = false;
        for (let k = 0; k < filtered.length; k++) {
          const entry = filtered[k];
          tries++;
          if (entry.levelResult == 'win') {
            won = true;
            break;
          }
        }
        if (!won) tries = 0;
        data.push(tries);
      }

      datasets.push(
        {
          label: logFile.fileName,
          data: data,
          fill: true,
          borderColor: getChartColor(i),
          backgroundColor: getChartColor(i)
        }
      )
    }

    plotBar(canvases[0], datasets, labels);
  }

  function displayNotas(section) {
    const subsection = insertSubsection(section, "Notas", "Notas finais de cada partida, considerando partidas finalizadas");
    const canvases = insertCharts(subsection, filteredJsons.length, false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];
      const canvas = canvases[i];

      const finishedLevels = logFile.logEntries.filter(log => log.levelResult == 'win' || log.levelResult == 'lose')

      var datasets = [
        {
          label: 'Crystals',
          data: finishedLevels.map(log => gradeToNumber(log.performances.crystals)),
          fill: true,
          backgroundColor: getChartColor(0),
        },
        {
          label: 'Jumps',
          data: finishedLevels.map(log => gradeToNumber(log.performances.jumps)),
          fill: true,
          backgroundColor: getChartColor(1),
        },
        {
          label: 'Fallls',
          data: finishedLevels.map(log => gradeToNumber(log.performances.falls)),
          fill: true,
          backgroundColor: getChartColor(2),
        },
        {
          label: 'Main Score',
          data: finishedLevels.map(log => gradeToNumber(log.performances.mainScore)),
          fill: true,
          backgroundColor: getChartColor(3),
        }

      ]
      const labels = finishedLevels.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotBar(canvas, datasets, labels, logFile.fileName, numberToGrade);
    }
  }

  function displayPortalGap(section) {
    const subsection = insertSubsection(section, "Portal Gap", "Abertura do portal ao final de cada partida, considerando partidas finalizadas");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const logFile = filteredJsons[i];
      const canvas = canvases[i];

      const finishedLevels = logFile.logEntries.filter(log => log.levelResult == 'win' || log.levelResult == 'lose')

      let datasets = [
        {
          label: logFile.fileName,
          data: finishedLevels.map(log => log.portalGap),
          fill: false,
          borderColor: getChartColor(i),
        }]
      const labels = finishedLevels.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotLinear(canvas, datasets, labels);
    }
  }

  function displayMediaNotas(section) {
    const subsection = insertSubsection(section, "Notas - Médias", "Média das notas em cada fase, considerando partidas finalizadas");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      let finishedLevels = logFile.logEntries.filter(log => log.levelResult == 'win' || log.levelResult == 'lose')
      finishedLevels.sort(sortLogFile);

      let infos = finishedLevels.reduce((acc, cur) => {
        acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, performances: cur.performances });
        return acc;
      }, []);

      let stages = [...new Set(infos.map(info => info.key))];
      let dataset = stages.map(stage => {
        let stageInfos = infos.filter(info => info.key == stage);
        let stageGrades = stageInfos.reduce((acc, cur) => {
          acc.crystals += gradeToNumber(cur.performances.crystals);
          acc.jumps += gradeToNumber(cur.performances.jumps);
          acc.falls += gradeToNumber(cur.performances.falls);
          acc.mainScore += gradeToNumber(cur.performances.mainScore);
          return acc;
        }, { crystals: 0, jumps: 0, falls: 0, mainScore: 0 });
        stageGrades.crystals /= stageInfos.length;
        stageGrades.jumps /= stageInfos.length;
        stageGrades.falls /= stageInfos.length;
        stageGrades.mainScore /= stageInfos.length;
        return stageGrades;
      })

      let datasets = [
        {
          label: 'Crystals',
          data: dataset.map(data => data.crystals),
          fill: true,
          backgroundColor: getChartColor(0),
        },
        {
          label: 'Jumps',
          data: dataset.map(data => data.jumps),
          fill: true,
          backgroundColor: getChartColor(1),
        },
        {
          label: 'Fallls',
          data: dataset.map(data => data.falls),
          fill: true,
          backgroundColor: getChartColor(2),
        },
        {
          label: 'Main Score',
          data: dataset.map(data => data.mainScore),
          fill: true,
          backgroundColor: getChartColor(3),
        }
      ]

      plotBar(canvas, datasets, stages, logFile.fileName, numberToGrade, 1.5);
    }
  }

  function displayMediaPortalGap(section) {
    const subsection = insertSubsection(section, "Portal Gap - Médio", "Abertura média do portal em cada fase, considerando apenas vitórias");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      let finishedLevels = logFile.logEntries.filter(log => log.levelResult == 'win')
      finishedLevels.sort(sortLogFile);

      let infos = finishedLevels.reduce((acc, cur) => {
        acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, portalGap: cur.portalGap });
        return acc;
      }, []);

      let stages = [...new Set(infos.map(info => info.key))];
      let data = stages.map(stage => {
        let stageInfos = infos.filter(info => info.key == stage);
        let stagePortalGap = stageInfos.reduce((acc, cur) => {
          acc += cur.portalGap;
          return acc;
        }, 0);
        stagePortalGap /= stageInfos.length;
        return stagePortalGap;
      })
      let datasets = [
        {
          label: logFile.fileName,
          data: data,
          fill: false,
          borderColor: getChartColor(i),
        }]
      plotLinear(canvas, datasets, stages);
    }
  }

  function displayEnergia(section) {
    const subsection = insertSubsection(section, "Energia", "Energia coletada e depositada em cada partida");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];

      let finishedLevels = logFile.logEntries.filter(log => log.levelResult == 'win' || log.levelResult == 'lose')

      let energiaColetada = finishedLevels.map(entry => {
        return entry.stats.crystals1Collected +
          entry.stats.crystals2Collected * 2 + entry.stats.crystals3Collected * 3;
      })
      let energiaDepositada = finishedLevels.map(entry => entry.stats.energyDeployed);

      let datasets = [
        {
          label: 'Energia Coletada',
          data: energiaColetada,
          fill: false,
          borderColor: getChartColor(0),
        },
        {
          label: 'Energia Depositada',
          data: energiaDepositada,
          fill: false,
          borderColor: getChartColor(1),
        }
      ]

      const labels = finishedLevels.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotRadar(canvas, datasets, labels, logFile.fileName);
    }
  }

  function displayMainScoreMaisAlto(section) {
    const subsection = insertSubsection(section, "Main Score Mais Alto", "Maior Main Score e quantidade de tentativas na fase");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      const playedLevels = [...logFile.logEntries].sort(sortLogFile);

      let infos = playedLevels.reduce((acc, cur) => {
        acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, performances: cur.performances });
        return acc;
      }, []);
      let stages = [...new Set(infos.map(info => info.key))];

      let highestGrades = stages.map(stage => {
        let stageInfos = infos.filter(info => info.key == stage);
        let stageMainScores = stageInfos.map(info => gradeToNumber(info.performances.mainScore));
        let maxGrade = Math.max(...stageMainScores);
        return maxGrade;
      });
      let numberOfTries = stages.map(stage => {
        return infos.filter(info => info.key == stage).length;
      });

      let datasets = [
        {
          label: 'Main Score (esquerda)',
          yAxisID: 'left',
          data: highestGrades,
          fill: true,
          backgroundColor: getChartColor(0)
        },
        {
          label: 'Tentativas (direita)',
          yAxisID: 'right',
          data: numberOfTries,
          fill: true,
          backgroundColor: getChartColor(1)
        }
      ];

      plotBarDoubleAxis(canvas, datasets, stages, logFile.fileName, 4, numberToGrade, null, 1.5);
    }
  }

  function displayTempoJogo(section) {
    const subsection = insertSubsection(section, "Tempo de jogo", "Tempo de jogo (minutos) acumulado e quantidade de tentativas na fase");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      const playedLevels = [...logFile.logEntries].sort(sortLogFile);

      let infos = playedLevels.reduce((acc, cur) => {
        acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, seconds: cur.stats.secondsPlayed });
        return acc;
      }, []);
      let stages = [...new Set(infos.map(info => info.key))];

      let playTime = stages.map(stage => {
        return infos.filter(info => info.key == stage).reduce((acc, cur) => {
          acc += cur.seconds / 60;
          return acc;
        }, 0)
      })
      let numberOfTries = stages.map(stage => {
        return infos.filter(info => info.key == stage).length;
      });

      let datasets = [
        {
          label: 'Tempo de jogo (esquerda)',
          yAxisID: 'left',
          data: playTime,
          fill: true,
          backgroundColor: getChartColor(0)
        },
        {
          label: 'Tentativas (direita)',
          yAxisID: 'right',
          data: numberOfTries,
          fill: true,
          backgroundColor: getChartColor(1)
        }
      ];

      plotBarDoubleAxis(canvas, datasets, stages, logFile.fileName, null, null, null, 1.5);
    }
  }

  function displayPowerups(section) {
    const subsection = insertSubsection(section, "Uso de Power-ups", "Quantidade de power-ups utilizado (<span class='green'>verde</span> = vitória | <span class='red'>vermelho</span> = derrota | <span class='yellow'>amarelo</span> = desistência");
    const canvases = insertCharts(subsection, filteredJsons.length, filteredJsons.length > 1 ? gridCharts : false);

    for (let i = 0; i < filteredJsons.length; i++) {
      const canvas = canvases[i];
      const logFile = filteredJsons[i];
      const playedLevels = logFile.logEntries.filter(file => (file.levelInfo.world == "Volcano" && file.levelInfo.level == 4));

      let colors = [];
      let powerups = playedLevels.map(info => {
        let color = info.levelResult == "win" ? "green" : (info.levelResult == "lose" ? "red" : "yellow");
        colors.push(color);
        return info.stats.powerUpsUsed;
      });

      let datasets = [
        {
          label: '',
          data: powerups,
          backgroundColor: colors
        }
      ]

      const labels = playedLevels.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotBar(canvas, datasets, labels, logFile.fileName);
    }
  }
}


// plot linear chart
function plotLinear(canvas, datasets, labels, title = null, yAxesTickCallback = null, aspectRatio = 2) {
  canvas.parentNode.classList.add('linear');
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      elements: {
        line: {
          tension: 0.2, // disables bezier curves
          borderWidth: 4
        }
      },
      scales: {
        xAxes: [{
          id: 'xAxis',
          ticks: {
            autoSkip: false,
            minRotation: 90,
            maxRotation: 90
          }
        }],
        yAxes: [{
          type: 'linear',
          ticks: {
            beginAtZero: true,
            callback: yAxesTickCallback ? yAxesTickCallback : (label) => { return label }
          }
        }]
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      },
      title: {
        display: title ? true : false,
        text: title
      },
      aspectRatio: aspectRatio,
      animation: false
    }
  });
}

// plot radar chart
function plotPolarArea(canvas, datasets, labels, title, aspectRatio = 1) {
  canvas.parentNode.classList.add('polarArea');
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      elements: {
        line: {
          tension: 0.2, // disables bezier curves
          borderWidth: 4
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: title
      },
      aspectRatio: aspectRatio,
      animation: false
    }
  });
}

function plotBar(canvas, datasets, labels, title = null, yAxesTickCallback = null, aspectRatio = 2) {
  canvas.parentNode.classList.add('bar');
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      scales: {
        xAxes: [{
          ticks: {
            autoSkip: false,
            minRotation: 90,
            maxRotation: 90
          }
        }],
        yAxes: [{
          type: 'linear',
          ticks: {
            beginAtZero: true,
            callback: yAxesTickCallback ? yAxesTickCallback : (label) => { return label }
          }
        }]
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      },
      title: {
        display: title ? true : false,
        text: title ? title : ''
      },
      aspectRatio: aspectRatio,
      animation: false
    }
  });
}

function plotBarDoubleAxis(canvas, datasets, labels, title = null, leftMaxTick = null, leftYAxesTickCallback = null, rightYAxesTickCallback = null, aspectRatio = 2) {
  canvas.parentNode.classList.add('bar');
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        xAxes: [{
          ticks: {
            autoSkip: false,
            minRotation: 90,
            maxRotation: 90
          }
        }],
        yAxes: [{
          id: 'left',
          type: 'linear',
          position: 'left',
          ticks: leftMaxTick ? {
            max: leftMaxTick,
            beginAtZero: true,
            callback: leftYAxesTickCallback ? leftYAxesTickCallback : (label) => { return label }
          } : {
              beginAtZero: true,
              callback: leftYAxesTickCallback ? leftYAxesTickCallback : (label) => { return label }
            }
        }, {
          id: 'right',
          type: 'linear',
          position: 'right',
          ticks: {
            beginAtZero: true,
            callback: rightYAxesTickCallback ? rightYAxesTickCallback : (label) => { return label }
          }
        }]
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      },
      title: {
        display: title ? true : false,
        text: title ? title : ''
      },
      aspectRatio: aspectRatio,
      animation: false
    }
  });
}

function plotRadar(canvas, datasets, labels, title, aspectRatio = 1) {
  canvas.parentNode.classList.add('radar');
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      },
      title: {
        display: title ? true : false,
        text: title ? title : ''
      },
      aspectRatio: aspectRatio,
      animation: false
    }
  })
}

function insertSection(sectionTitle) {
  // create section
  let parent = document.createElement("div");
  parent.classList.add("chartsSection", "scrollspy");
  parent.setAttribute("id", sectionTitle);
  document.body.appendChild(parent);

  // add section to menu
  let navItem = document.createElement("li");
  let navItem_a = document.createElement("a");
  navItem_a.setAttribute("href", `#${sectionTitle}`);
  navItem_a.setAttribute(`data-target`, `dropdown_${dropID}`);
  navItem_a.innerHTML = sectionTitle;
  navItem_a.classList.add(`dropdown-trigger`);
  navItem.appendChild(navItem_a);
  navMenu.appendChild(navItem);
  let navitem_a_arrow = document.createElement(`i`);
  navitem_a_arrow.classList.add(`material-icons`, `right`);
  navitem_a_arrow.innerHTML = `arrow_drop_down`;
  navItem_a.appendChild(navitem_a_arrow);

  // make dropdown
  let ul = document.createElement("ul");
  ul.setAttribute(`id`, `dropdown_${dropID}`);
  ul.classList.add(`dropdown-content`);
  document.body.appendChild(ul);
  dropID++;

  return { section: parent, dropdown: ul };
}

// insere uma nova seção
function insertSubsection(section, subsectionTitle, sectionDescription) {
  // create section
  let parent = document.createElement("div");
  parent.classList.add("subsection", "scrollspy");
  parent.setAttribute("id", subsectionTitle);
  let titleParent = document.createElement("div");
  titleParent.classList.add("row");
  let titleCenter = document.createElement("div");
  titleCenter.classList.add("col", "s12", "center-align");
  let title = document.createElement("h1");
  title.classList.add("subsectionTitle")
  title.innerHTML = subsectionTitle;
  let description = document.createElement("p");
  description.classList.add("subsectionDescription");
  description.innerHTML = sectionDescription;
  section.section.appendChild(parent);
  parent.appendChild(titleParent);
  titleParent.appendChild(titleCenter);
  titleCenter.appendChild(title);
  titleCenter.appendChild(description);

  // add to dropdown
  let li = document.createElement(`li`);
  let a = document.createElement(`a`);
  a.innerHTML = subsectionTitle;
  a.setAttribute(`href`, `#${subsectionTitle}`);
  li.appendChild(a);
  section.dropdown.appendChild(li);

  // add section to side menu
  navItem = document.createElement("li");
  navItem_a = document.createElement("a");
  navItem_a.setAttribute("href", `#${subsectionTitle}`)
  navItem_a.classList.add("sidenav-close");
  navItem_a.innerHTML = subsectionTitle;
  navItem.appendChild(navItem_a);
  sideNav.appendChild(navItem);

  return parent;
}


// insere e retorna um canvas
function insertCharts(section, numberOfCanvas, twoAtLine) {

  var canvasResult = [];

  let i = 0;
  while (i < numberOfCanvas) {
    let parent = document.createElement("div");
    parent.classList.add("row");
    section.appendChild(parent);

    let s1_1 = document.createElement("div");
    s1_1.classList.add("col", "s1");
    parent.appendChild(s1_1);

    let canvasParentRow = document.createElement("div");
    canvasParentRow.classList.add("col", "s10");
    parent.appendChild(canvasParentRow);

    let chartElement;
    if (twoAtLine) {
      for (let j = 0; j < 2; j++) {
        if (i >= numberOfCanvas) {
          let left = document.createElement("div");
          left.classList.add("col", "xl3");
          chartElement.parentNode.insertBefore(left, chartElement);
          let right = document.createElement("div");
          right.classList.add("col", "xl3");
          chartElement.parentNode.appendChild(right);
          break;
        }
        chartElement = document.createElement("div");
        chartElement.classList.add("col", "s12", "xl6");
        canvasParentRow.appendChild(chartElement);

        let canvasParent = document.createElement("div");
        canvasParent.classList.add("center-align", "canvasParent");
        chartElement.appendChild(canvasParent);

        let canvas = document.createElement("canvas");
        canvasParent.appendChild(canvas);
        canvasResult.push(canvas);
        i++;
      }
    } else {
      let chartElement = document.createElement("div");
      chartElement.classList.add("col", "s12");
      canvasParentRow.appendChild(chartElement);

      let canvasParent = document.createElement("div");
      canvasParent.classList.add("center-align", "canvasParent");
      chartElement.appendChild(canvasParent);

      let canvas = document.createElement("canvas");
      canvasParent.appendChild(canvas);
      canvasResult.push(canvas);
      i++;
    }

    let s1_2 = document.createElement("div");
    s1_2.classList.add("col", "s1");
    parent.appendChild(s1_2);
  }

  return canvasResult;
}

function updateScrollSpy() {
  var elems = document.querySelectorAll('.scrollspy');
  M.ScrollSpy.init(elems, { throttle: 0, scrollOffset: 40 });
}
function updateSideNav() {
  // M.Sidenav.init(elems, options);
  new M.Sidenav(sideNav);
}

function updateDropdowns() {
  var elems = document.querySelectorAll('.dropdown-trigger');
  M.Dropdown.init(elems, { coverTrigger: false, hover: true });
}

function getChartColor(i) {
  return chartsColors[i % chartsColors.length];
}

function sortLogFile(a, b) {
  return (refSortArray.indexOf(a.levelInfo.world) * 100 + a.levelInfo.level) - (refSortArray.indexOf(b.levelInfo.world) * 100 + b.levelInfo.level);
}

function filterJsons() {
  filter.classList.remove("hide");

  filteredJsons = jsons.reduce((acc, cur) => {
    acc.push({
      logEntries: cur.logEntries.filter(entry => checkboxStatus[entry.levelInfo.world]),
      fileName: cur.fileName
    })
    return acc;
  }, []);
  clearSections();
  displayData();
}

function gradeToNumber(grade) {
  switch (grade) {
    case 'S': return 4;
    case 'A': return 3;
    case 'B': return 2;
    case 'C': return 1;
    default: return 0
  }
}

function numberToGrade(label, index, labels) {
  switch (label) {
    case 4: return 'S';
    case 3: return 'A';
    case 2: return 'B';
    case 1: return 'C';
    default: return ''
  }
}

function readJSONLocal() {
  clearJsons();

  const files = ["data/log.json", "data/log_Daniel.json", "data/log_Dawson.json", "data/log_Stefan.json", "data/log_Connor.json"];
  let count = 0;
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const element = files[i];
    const xhr = new XMLHttpRequest();
    count++;
    xhr.open('GET', element, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      if (this.status == 200) {
        const file = new Blob([this.response], { type: 'text' });
        const fileReader = new FileReader();
        fileReader.addEventListener('load', function () {
          const json = JSON.parse(fileReader.result);
          json.fileName = fileName;
          jsons.push(json);
          if (jsons.length >= count) {
            filterJsons();
          }
        });
        fileReader.readAsText(file);
      }
    }
    xhr.send();
  }
}

// debug locally
// readJSONLocal();