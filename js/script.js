const jsons = [];
const downloadWrapper = document.getElementById('download');
const uploadWrapper = document.getElementById('upload');
const navMenu = document.querySelector('.nav-wrapper ul');
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

  // shuffle colors
  chartsColors.sort(() => 0.5 - Math.random());

  // clear jsons
  jsons.length = 0;
}

function displayData() {

  displayQuedas();
  displayQuedasVulcao();
  displayPrimeiraQueda();
  displayMediaPrimeiraQueda();

  function displayQuedas() {
    var section = insertSection("Quedas");
    var canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];
      const canvas = canvases[i];
      const ctx = canvas.getContext("2d");

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

      plotLinear(ctx, datasets, labels);
    }
  }

  function displayQuedasVulcao() {
    var section = insertSection("Quedas Vulcão");
    var canvases = insertCharts(section, 1, false);

    const canvas = canvases[0];
    const ctx = canvas.getContext("2d");
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
    plotLinear(ctx, datasets, labels);
  }

  function displayPrimeiraQueda() {
    var section = insertSection("Primeira Queda");
    var canvases = insertCharts(section, jsons.length, gridCharts);

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];
      const canvas = canvases[i];
      const ctx = canvas.getContext("2d");

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

      plotLinear(ctx, datasets, labels);
    }
  }

  function displayMediaPrimeiraQueda() { };
}


// plot linear chart
function plotLinear(ctx, datasets, labels) {
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


// insere uma nova seção
function insertSection(sectionTitle) {
  // create section
  let parent = document.createElement("div");
  parent.classList.add("chartSection");
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

function getChartColor(i) {
  return chartsColors[i % chartsColors.length];
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
        const file = new File([this.response], 'temp');
        const fileReader = new FileReader();
        fileReader.addEventListener('load', function () {
          const json = JSON.parse(fileReader.result);
          json.fileName = fileName;
          jsons.push(json);
          if (jsons.length >= count) {
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
