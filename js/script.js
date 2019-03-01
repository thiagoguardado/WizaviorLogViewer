var unifiedJSON = { logEntries: [] };
var jsons = [];
var downloadWrapper = document.getElementById('download');
var uploadWrapper = document.getElementById('upload');

var chartsColors = [];

function uploadLogs(e) {
  // stop button pulsing
  uploadWrapper.querySelector('a').classList.remove("pulse");

  readJSONs(e);
}

function downloadLog() {
  // stop button pulsing
  downloadWrapper.querySelector('a').classList.remove("pulse");

  // download
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unifiedJSON));
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "wizaviorLog.json");
  dlAnchorElem.click();
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

function setupNewImport(){
  // clear previous data
  let sections = document.querySelectorAll(".chartSection");
  for (let i = 0; i < sections.length; i++) {
    sections[i].parentNode.removeChild(sections[i]);
  }

  // change colors
  chartsColors.length = 0;
  for (let i = 0; i < 10; i++) {
    chartsColors.push(`rgba(${(Math.random() * 255).toFixed(0)},${(Math.random() * 255).toFixed(0)},${(Math.random() * 255).toFixed(0)},255)`);
  }

  // clear jsons
  jsons.length = 0;
}

function displayData() {

  displayQuedas();

  function displayQuedas() {
    var section = insertSection("Quedas");
    var canvases = insertCharts(section, jsons.length, true);

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];

      var canvas = canvases[i];
      var ctx = canvas.getContext("2d");

      var data = logFile.logEntries.map(log => log.stats.falls);
      var labels = logFile.logEntries.map(log => log.levelInfo.world + "_" + log.levelInfo.level);
      var color = chartsColors[i];
      plotLinear(ctx, logFile.fileName, data, labels, color);
    }
  }
}

// plot linear chart
function plotLinear(ctx, name, data, labels, color) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: name,
          data: data,
          fill: false,
          borderColor: color,
          xAxisID: 'xAxis'
        }
      ]
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
      }
    }
  });
}


// insere uma nova seção
function insertSection(titleText) {
  var parent = document.createElement("div");
  parent.classList.add("chartSection");
  var titleParent = document.createElement("div");
  titleParent.classList.add("row");
  var titleCenter = document.createElement("div");
  titleCenter.classList.add("col", "s12", "center-align");
  var title = document.createElement("h3");
  title.innerHTML = titleText;

  document.body.appendChild(parent);
  parent.appendChild(titleParent);
  titleParent.appendChild(titleCenter);
  titleCenter.appendChild(title);
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

    if (twoAtLine) {
      for (let j = 0; j < 2; j++) {
        let chartElement = document.createElement("div");
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


function readJSONLocal() {
  setupNewImport();

  const files = ["data/log.json","data/log_Daniel.json","data/log_Dawson.json","data/log_Stefan.json", "data/log_Connor.json"];
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
