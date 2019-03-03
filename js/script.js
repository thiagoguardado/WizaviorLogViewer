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

  updateScrollSpy();
  updateSideNav();

  function displayQuedas() {
    var section = insertSection("Quedas");
    var canvases = insertCharts(section, jsons.length, gridCharts);

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
    var section = insertSection("Quedas Vulcão");
    var canvases = insertCharts(section, 1, false);

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
    var section = insertSection("Primeira Queda");
    var canvases = insertCharts(section, jsons.length, gridCharts);

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
    var section = insertSection("Média Primeira Queda");
    var canvases = insertCharts(section, jsons.length, gridCharts);

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
    var section = insertSection("Menor Tempo Queda");
    var canvases = insertCharts(section, jsons.length, gridCharts);

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
      plotRadar(canvas, datasets, stages, logFile.fileName);
    }
  }

  function displayVitoriasDerrotas() {
    var section = insertSection("Vitórias");
    var canvases = insertCharts(section, jsons.length, gridCharts);

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
      var labels = endedLogs.map(log => log.levelInfo.world + "_" + log.levelInfo.level);

      plotLinear(canvas, datasets, labels);
    }
  }
}




// plot linear chart
function plotLinear(canvas, datasets, labels) {
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
        }]
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      }
    }
  });
}

// plot radar chart
function plotRadar(canvas, datasets, labels, title) {
  canvas.parentNode.classList.add('radar');
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