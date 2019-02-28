var unifiedJSON = { logEntries: [] };
var jsons = [];
var downloadWrapper = document.getElementById('download');
var uploadWrapper = document.getElementById('upload');

function uploadLogs(e) {
  // stop button pulsing
  uploadWrapper.querySelector('a').classList.remove("pulse");

  // make download button visible and pulsing
  uploadWrapper.classList.remove('s6');
  uploadWrapper.classList.add('s3');
  downloadWrapper.classList.remove("hide");
  downloadWrapper.querySelector('a').classList.add("pulse");

  console.log(e);
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
  // clear jsons
  concatenatedJson = null;

  var files = evt.target.files; // FileList object
  var countReads = 0;

  // Loop through the FileList
  for (var i = 0; i < files.length; i++) {
    read(files[i]);
  }

  function read(file) {
    // Only process json files.
    if (!file.type.match('application/json')) {
      return;
    }

    countReads++;

    var reader = new FileReader();

    reader.onload = function () {
      jsons.push(JSON.parse(reader.result));
      if (jsons.length >= countReads) {
        concatenateJSONs(jsons);
        displayData();
      }
    };

    // Read
    reader.readAsText(file);
  }
}

function concatenateJSONs(JSONs) {
  unifiedJSON.logEntries.length = 0;
  for (let i = 0; i < JSONs.length; i++) {
    unifiedJSON.logEntries = unifiedJSON.logEntries.concat(JSONs[i].logEntries)
  }
}

function displayData() {

  displayQuedas();

  function displayQuedas() {

    var section = insertSection("Quedas");

    for (let i = 0; i < jsons.length; i++) {
      const logFile = jsons[i];

      var canvas = insertChartInDom(section);
      var ctx = canvas.getContext("2d");

      console.log(logFile.logEntries);
      var data = logFile.logEntries.map(log => log.stats.falls);
      var labels = logFile.logEntries.map(log => log.levelInfo.world + "_" + log.levelInfo.level);
      var color = `'rgba("${Math.random().toFixed(1)},${Math.random().toFixed(1)},${Math.random().toFixed(1)},1)'`;
      var clor_black = 'rgba(1,1,1,1)'
      console.log(color);
      var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: logFile.fileName,
              data: data,
              fill:false,
              borderColor:clor_black
            }
          ]
        },
        options: {
          elements: {
            line: {
              tension: 0.1, // disables bezier curves
              borderWidth: 3
            }
          }
        }
      });
    }


  }

}


// insere uma nova seção
function insertSection(titleText) {
  var parent = document.createElement("div");
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


// insere e retorn um canvas
function insertChartInDom(section) {
  var parent = document.createElement("div");
  parent.classList.add("row");
  var s1_1 = document.createElement("div");
  s1_1.classList.add("col", "s1");
  var s10 = document.createElement("div");
  s10.classList.add("col", "s10");
  var canvasParent = document.createElement("div");
  canvasParent.classList.add("center-align", "canvasParent");
  var canvas = document.createElement("canvas");
  var s1_2 = document.createElement("div");
  s1_2.classList.add("col", "s1");

  section.appendChild(parent);
  parent.appendChild(s1_1);
  parent.appendChild(s10);
  s10.appendChild(canvasParent);
  canvasParent.appendChild(canvas);
  parent.appendChild(s1_2);
  return canvas;
}

function old_displayData() {
  var results = getResults();
  plotResults(results);

  var falls = getFalls();
  plotFalls(falls);


  function getResults() {
    var results = {};
    unifiedJSON.logEntries.reduce(function (data, entry) {
      let title = entry.levelInfo.world + "_" + entry.levelInfo.level;
      if (!(title in results)) {
        results[title] = {};
        results[title].wins = 0;
        results[title].loses = 0;
        results[title].aborts = 0;
      }
      results[title].wins += entry.stats.wins;
      results[title].loses += entry.stats.loses;
      results[title].aborts += entry.stats.abortions;
    });
    console.groupCollapsed("Resultados");
    console.table(results);
    console.groupEnd();
    return results;
  }

  function getFalls() {
    var falls = {};
    unifiedJSON.logEntries.reduce(function (data, entry) {
      let title = entry.levelInfo.world + "_" + entry.levelInfo.level;
      if (!(title in falls)) {
        falls[title] = {};
        falls[title].falls = 0;
        falls[title].count = 0;
      }
      falls[title].falls += entry.stats.falls;
      falls[title].count++;
    });
    Object.values(falls).map(function (item) { item.fallAverage = item.falls / item.count });

    console.groupCollapsed("Quedas");
    console.table(falls);
    console.groupEnd();
    return falls;
  }

  function plotResults(results) {
    var ctx_bar = document.getElementById("chart_results_bar").getContext("2d");
    var ctx_radar = document.getElementById("chart_results_radar").getContext("2d");

    var data = {
      labels: Object.keys(results),
      datasets: [
        {
          label: 'vitorias',
          data: Object.values(results).map(function (item) { return item.wins }),
          borderWidth: 1,
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          borderColor: 'green'
        },
        {
          label: 'derrotas',
          data: Object.values(results).map(function (item) { return item.loses }),
          borderWidth: 1,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderColor: 'red'
        },
        {
          label: 'interrupcoes',
          data: Object.values(results).map(function (item) { return item.aborts }),
          borderWidth: 1,
          backgroundColor: 'rgba(255, 204, 0, 0.1)',
          borderColor: 'gold'
        }
      ]
    }

    document.getElementById('row-resultados').classList.remove('hide');

    var barChart = new Chart(ctx_bar, {
      type: 'bar',
      data: data
    });
    var radarChart = new Chart(ctx_radar, {
      type: 'radar',
      data: data,
      options: {
        legend: {
          display: false
        }
      }
    });
  }

  function plotFalls(falls) {
    var ctx_bar1 = document.getElementById("chart_falls_bar1").getContext("2d");
    var ctx_bar2 = document.getElementById("chart_falls_bar2").getContext("2d");

    var data1 = {
      labels: Object.keys(falls),
      datasets: [
        {
          label: 'numero total de quedas',
          data: Object.values(falls).map(function (item) { return item.falls }),
          borderWidth: 1,
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          borderColor: 'red'
        }
      ]
    }
    var data2 = {
      labels: Object.keys(falls),
      datasets: [
        {
          label: 'numero medio de quedas',
          data: Object.values(falls).map(function (item) { return item.fallAverage }),
          borderWidth: 1,
          backgroundColor: 'rgba(255, 204, 0, 0.8)',
          borderColor: 'gold'
        }
      ]
    }

    document.getElementById('row-quedas').classList.remove('hide');

    var barChart1 = new Chart(ctx_bar1, {
      type: 'bar',
      data: data1,
      options: {
        maintainAspectRatio: false,
      }
    });

    var barChart2 = new Chart(ctx_bar2, {
      type: 'bar',
      data: data2,
      options: {
        maintainAspectRatio: false,
      }
    });
  }
}


function readJSONLocal() {
  var files = ["../log_Stefan.json", "../log_Connor.json"];
  var count = 0;
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i]
    const element = files[i];
    var xhr = new XMLHttpRequest();
    count++;
    xhr.open('GET', element, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      if (this.status == 200) {
        var file = new File([this.response], 'temp');
        var fileReader = new FileReader();
        fileReader.addEventListener('load', function () {
          var json = JSON.parse(fileReader.result);
          json.fileName = fileName;
          jsons.push(json);
          if (jsons.length >= count) {
            console.log(jsons);
            concatenateJSONs(jsons);
            displayData();
          }
        });
        fileReader.readAsText(file);
      }
    }
    xhr.send();
  }
}

// readJSONLocal();


