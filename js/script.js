const downloadWrapper = document.getElementById('download');
const uploadWrapper = document.getElementById('upload');
const navMenu = document.querySelector('.nav-wrapper ul');
const sideNav = document.querySelector('ul.sidenav');
const refSortArray = ["Tutorial", "Arctic", "Desert", "Forest", "Volcano", "Boss"];
let jsons = [];
let unifiedJSON = [];
let gridCharts = true;

var chartsColors = [
  "#9e0202",
  "#ff9400",
  "#60ad01",
  "#01ad96",
  "#0056d8",
  "#6f39f9",
  "#91039e",
];

function uploadLogs(e) {
  // stop button pulsing
  uploadWrapper.querySelector('a').classList.remove("pulse");

  readJSONs(e);
}

function readJSONs(evt) {

  setupNewImport();

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
        concatenateJSONs();
        displayData();
      }
    };

    // Read
    reader.readAsText(file);
  }
}

function setupNewImport() {
  // clear previous data
  let sections = document.querySelectorAll(".chartSection");
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

  // shuffle colors
  chartsColors.sort(() => 0.5 - Math.random());

  // clear jsons
  jsons.length = 0;
}

function concatenateJSONs() {
  unifiedJSON.length = 0;

  jsons.map(json => {
    json.logEntries.map(entry => entry.fileName = json.fileName);
    unifiedJSON.push(...json.logEntries);
  });
}

function displayData() {

  displayQuedas();
  displayQuedasVulcao();
  displayPrimeiraQueda();
  displayMediaPrimeiraQueda();
  displayMenorTempoDeQueda();
  displayVitoriasDerrotas();
  displayTentativas();
  displayNotas();
  displayMediaNotas();
  displayEnergia();

  updateScrollSpy();
  updateSideNav();

  function displayQuedas() {
    const section = insertSection("Quedas");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];
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

  function displayQuedasVulcao() {
    const section = insertSection("Quedas Vulcão");
    const canvases = insertCharts(section, 1, false);

    const canvas = canvases[0];
    let datasets = [];
    let stages = [1, 2, 3, 4];

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];

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

  function displayPrimeiraQueda() {
    const section = insertSection("Primeira Queda");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];
      const canvas = canvases[i];

      var datasets = [
        {
          label: logFile.fileName,
          data: logFile.logEntries.map(log => {
            if (log.fallsTimes.length > 0) {
              return log.fallsTimes[0]
            } else {
              return 0;
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

  function displayMediaPrimeiraQueda() {
    const section = insertSection("Média Primeira Queda");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const canvas = canvases[i];
      const logFile = jsons[i];
      logFile.logEntries.sort(sortLogFile);

      let infos = logFile.logEntries.reduce((acc, cur) => {
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

  function displayMenorTempoDeQueda() {
    const section = insertSection("Menor Tempo Queda");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const canvas = canvases[i];
      const logFile = jsons[i];
      logFile.logEntries.sort(sortLogFile);

      let infos = logFile.logEntries.reduce((acc, cur) => {
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

  function displayVitoriasDerrotas() {
    const section = insertSection("Vitórias");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];
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

      let chart = plotLinear(canvas, datasets, labels, null, yAxesCallback);
    }
  }

  function displayTentativas() {
    const section = insertSection("Tentativas Para Ganhar");
    const canvases = insertCharts(section, 1, false);

    const labels = [...new Set(unifiedJSON.sort(sortLogFile).map(log => log.levelInfo.world + "_" + log.levelInfo.level))];
    let datasets = [];

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];

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

  function displayNotas() {
    const section = insertSection("Notas");
    const canvases = insertCharts(section, jsons.length, false);

    let gradeToNumber = function (grade) {
      switch (grade) {
        case 'S': return 4;
        case 'A': return 3;
        case 'B': return 2;
        case 'C': return 1;
        default: return 0
      }
    }

    let numberToGrade = function (label, index, labels) {
      switch (label) {
        case 4: return 'S';
        case 3: return 'A';
        case 2: return 'B';
        case 1: return 'C';
        default: return ''
      }
    }

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];
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

  function displayMediaNotas() {
    const section = insertSection("Notas - Médias");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    let gradeToNumber = function (grade) {
      switch (grade) {
        case 'S': return 4;
        case 'A': return 3;
        case 'B': return 2;
        case 'C': return 1;
        default: return 0
      }
    }

    let numberToGrade = function (label, index, labels) {
      switch (label) {
        case 4: return 'S';
        case 3: return 'A';
        case 2: return 'B';
        case 1: return 'C';
        default: return ''
      }
    }

    for (let i = 0; i < jsons.length; i++) {
      const canvas = canvases[i];
      const logFile = jsons[i];
      let finishedLevels = logFile.logEntries.filter(log => log.levelResult == 'win' || log.levelResult == 'lose')
      finishedLevels.sort(sortLogFile);

      let infos = finishedLevels.reduce((acc, cur) => {
        let newitem = { world: cur.levelInfo.world, level: cur.levelInfo.level };
        if (!acc.includes(newitem)) {
          if (cur.fallsTimes.length != 0)
            acc.push({ key: cur.levelInfo.world + "_" + cur.levelInfo.level, world: cur.levelInfo.world, level: cur.levelInfo.level, performances: cur.performances });
        }
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

      plotBar(canvas, datasets, stages, logFile.fileName, numberToGrade);
    }
  }

  function displayEnergia() {
    const section = insertSection("Energia");
    const canvases = insertCharts(section, jsons.length, gridCharts);

    
    for (let i = 0; i < jsons.length; i++) {
      const canvas = canvases[i];
      const logFile = jsons[i];
      
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
      console.log(datasets);

      const labels = finishedLevels.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotRadar(canvas, datasets, labels, logFile.fileName);
    }
  }
}




// plot linear chart
function plotLinear(canvas, datasets, labels, title = null, yAxesTickCallback = null) {
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
        yAxes: yAxesTickCallback ? [{ ticks: { callback: yAxesTickCallback } }] : ''
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
    }
  });
}

// plot radar chart
function plotPolarArea(canvas, datasets, labels, title) {
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
      aspectRatio: 1
    }
  });
}

function plotBar(canvas, datasets, labels, title = null, yAxesTickCallback = null) {
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
    }
  });
}

function plotRadar(canvas, datasets, labels, title) {
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
      aspectRatio: 1
    }
  })
}


// insere uma nova seção
function insertSection(sectionTitle) {
  // create section
  let parent = document.createElement("div");
  parent.classList.add("chartSection", "scrollspy");
  parent.setAttribute("id", sectionTitle);
  let titleParent = document.createElement("div");
  titleParent.classList.add("row");
  let titleCenter = document.createElement("div");
  titleCenter.classList.add("col", "s12", "center-align");
  let title = document.createElement("h1");
  title.classList.add("sectionTitle")
  title.innerHTML = sectionTitle;
  document.body.appendChild(parent);
  parent.appendChild(titleParent);
  titleParent.appendChild(titleCenter);
  titleCenter.appendChild(title);

  // add section to menu
  let navItem = document.createElement("li");
  let navItem_a = document.createElement("a");
  navItem_a.setAttribute("href", `#${sectionTitle}`)
  navItem_a.innerHTML = sectionTitle;
  navItem.appendChild(navItem_a);
  navMenu.appendChild(navItem);

  // add section to side menu
  navItem = document.createElement("li");
  navItem_a = document.createElement("a");
  navItem_a.setAttribute("href", `#${sectionTitle}`)
  navItem_a.classList.add("sidenav-close");
  navItem_a.innerHTML = sectionTitle;
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

function getChartColor(i) {
  return chartsColors[i % chartsColors.length];
}

function sortLogFile(a, b) {
  return (refSortArray.indexOf(a.levelInfo.world) * 100 + a.levelInfo.level) - (refSortArray.indexOf(b.levelInfo.world) * 100 + b.levelInfo.level);
}

function readJSONLocal() {
  setupNewImport();

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
            concatenateJSONs();
            displayData();
          }
        });
        fileReader.readAsText(file);
      }
    }
    xhr.send();
  }
}

readJSONLocal();