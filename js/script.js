var unifiedJSON = { logEntries: [] };
var downloadWrapper = document.getElementById('download');
var uploadWrapper = document.getElementById('upload');

function uploadLogs(e) {
  uploadWrapper.querySelector('a').classList.remove("pulse");
  uploadWrapper.classList.remove('s6');
  uploadWrapper.classList.add('s3');
  downloadWrapper.querySelector('a').classList.add("pulse");
  downloadWrapper.classList.remove("hide");

  readJSONs(e);
}

function downloadLog() {
  downloadWrapper.querySelector('a').classList.remove("pulse");
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unifiedJSON));
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "wizaviorLog.json");
  dlAnchorElem.click();
}

function readJSONs(evt) {
  var files = evt.target.files; // FileList object
  var JSONs = [];
  var countReads = 0;

  // Loop through the FileList and render image files as thumbnails.
  for (var i = 0; i < files.length; i++) {
    read(files[i]);
  }

  function read(file) {

    // Only process image files.
    if (!file.type.match('application/json')) {
      return;
    }

    countReads++;

    var reader = new FileReader();

    reader.onload = function () {
      JSONs.push(reader.result);
      if (JSONs.length >= countReads) {
        concatenateJSONs(JSONs);

        displayData();
      }
    };

    // Read in the image file as a data URL.
    reader.readAsText(file);
  }
}

function concatenateJSONs(JSONs) {
  unifiedJSON.logEntries.length = 0;
  for (let i = 0; i < JSONs.length; i++) {
    unifiedJSON.logEntries = unifiedJSON.logEntries.concat(JSON.parse(JSONs[i]).logEntries)
  }

  // document.getElementById("jsonViewer").innerHTML = JSON.stringify(unifiedJSON, undefined, '\t');
}

function displayData() {
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


