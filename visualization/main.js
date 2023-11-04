const dataLayout = [
    { name: 'Wassertemperatur', unit: '°C', color: '#4e79a7', fill: false, yAxisID: 'y-axis-0', show: false },
    { name: 'Lufttemperatur', unit: '°C', color: '#f28e2b', fill: false, yAxisID: 'y-axis-0', show: false },
    { name: 'Luftfeuchtigkeit', unit: '%', color: '#76b7b2', fill: false, yAxisID: 'y-axis-1', show: true },
    { name: 'Referenztemperatur', unit: '°C', color: '#f5e042', fill: false, yAxisID: 'y-axis-0', show: true },
];

// Einstiegspunkt
document.addEventListener('DOMContentLoaded', function ()
{
    listAndFillMeasurements();

    // Laden und Verarbeiten der CSV-Daten für das erste Diagramm
    processData('/liveData.csv').then(data =>
    {
        liveChart = createChart('liveChart', undefined, {
            labels: data.labels,
            datasets: data.datasets,
        });

        startSSE();
    });
});

let liveChart;
let measurements_loading_placeholder;

// Funktion zum Hinzufügen einer neuen Datenzeile zum Diagramm
function updateChartWithNewData(newDataLine)
{
    csvRowToChartsJSdataset(newDataLine, liveChart.data.datasets, liveChart.data.labels);

    liveChart.update();
}

// CSV-Daten verarbeiten
function csvRowToChartsJSdataset(csv_row, datasets, labels)
{
    const columns = csv_row.split(';');
    const timestampString = columns[0];

    var timestamp = new Date(timestampString);

    if (!isNaN(timestamp.getTime())) 
    {
        var formattedTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp);
        labels.push(formattedTime);
    }
    else
    {
        console.log("Hallo", timestampString);
        labels.push('?');
    }

    for (let j = 1; j < columns.length; j++)
    {
        const value = parseFloat(columns[j]);
        datasets[j - 1].data.push(value);
    }
}

async function processData(url)
{
    const response = await fetch(url);

    // Überprüfen des Statuscodes
    if (response.status !== 200)
    {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const csvData = await response.text();

    const rows = csvData.split('\n');
    const labels = [];
    const datasets = [];

    // Ich nehme an, dass `dataLayout` ein zuvor definierter Array von Objekten ist.
    for (let i = 0; i < dataLayout.length; i++)
    {
        const columnInfo = dataLayout[i];

        datasets.push({
            label: `${columnInfo.name}`,
            data: [],
            borderColor: columnInfo.color,
            borderWidth: 2,
            fill: columnInfo.fill,
            yAxisID: columnInfo.yAxisID,
            pointRadius: 0,
        });
    }

    for (let i = 1; i < rows.length; i++)
    {
        const row_text = rows[i];

        if (row_text != "")
        {
            csvRowToChartsJSdataset(row_text, datasets, labels);
        }
    }

    return { labels, datasets };
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 0
    },
    hover: {
        animationDuration: 0
    },
    responsiveAnimationDuration: 0,
    interaction: {
        intersect: false,
        mode: 'index',
    },
    scales: {
        x: {
            ticks: {
                autoSkip: true,
                maxTicksLimit: 20
            }
        },
        'y-axis-0': {
            position: 'left',
            beginAtZero: false,
            ticks: {
                stepSize: 0.5,
                callback: function (value)
                {
                    return value + " °C";
                }
            },
            title: {
                display: false,
            }
        },
        'y-axis-1': {
            position: 'right',
            suggestedMin: 0,
            suggestedMax: 100,
            beginAtZero: true,
            grid: {
                display: false,
            },
            ticks: {
                stepSize: 0.5,
                callback: function (value)
                {
                    return value + ' %';
                }
            },
            title: {
                display: false,
            }
        },
    },
    plugins: {
        title: {
            display: true,
            text: '',
        },
    },
};


// Diagramm erstellen
function createChart(canvasId, title, data) 
{
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Erstellen Sie eine tiefe Kopie der chartOptions
    const options = JSON.parse(JSON.stringify(chartOptions));

    if (title !== undefined)
    {
        options.plugins.title.text = title;
        options.plugins.title.display = true;
    }
    else
    {
        options.plugins.title.display = false;
    }

    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: options,
    });
}

function restartMeasurement() 
{
    fetch('/restart_measurement', { method: 'GET' })
        .then(response =>
        {
            if (response.ok)
            {
                updateChart(liveChart, '/liveData.csv');
            }
            else
            {
                console.error("Fehler beim Neustart der Messung:", response);
            }
        })
        .catch(error =>
        {
            console.error("Netzwerkfehler:", error);
        });
}

function deleteMeasurement(filename) 
{
    fetch(`/delete_measurement?filename=${encodeURIComponent(filename)}`, {
        method: 'GET'
    })
        .then(response =>
        {
            if (response.ok)
            {
                listAndFillMeasurements();
            }
            else
            {
                console.error("Fehler beim Neustart der Messung:", response);
            }
        })
        .catch(error =>
        {
            console.error("Netzwerkfehler:", error);
        });
}

function saveMeasurement() 
{
    const filename = prompt("Bitte Dateinamen eingeben");

    if (filename)
    {
        fetch(`/save_measurement?filename=${encodeURIComponent(filename)}`, {
            method: 'GET'
        })
            .then(response =>
            {
                if (response.ok)
                {
                    listAndFillMeasurements();
                }
                else
                {
                    console.error("Fehler beim Speichern der Messung.");
                }
            })
            .catch(error =>
            {
                console.error("Netzwerkfehler:", error);
            });
    }
    else
    {
        console.log("Das Speichern wurde abgebrochen, kein Dateiname angegeben.");
    }
}

// Diagramm mit neuen Daten aktualisieren
async function updateChart(chart, url)
{
    const newData = await processData(url);

    chart.data.labels = newData.labels;
    chart.data.datasets.forEach((dataset, i) =>
    {
        dataset.data = newData.datasets[i].data;
    });
    chart.update();
}

function initChart(canvasId, csvFilename)
{
    processData('/data/' + csvFilename).then(data =>
    {
        // Dateiname ohne Endung als Titel setzen
        const title = csvFilename.replace('.csv', '');
        createChart(canvasId, title, {
            labels: data.labels,
            datasets: data.datasets,
        });
    });
}

function listAndFillMeasurements()
{
    // Merke die initiale Ladelogik
    if (!measurements_loading_placeholder)
    {
        measurements_loading_placeholder = document.getElementById("measurements").innerHTML;
    }

    // Setze Ladelogik
    document.getElementById("measurements").innerHTML = measurements_loading_placeholder;

    fetch('/list_measurements?time=' + new Date().getTime())
        .then(response => response.json())
        .then(files =>
        {
            const measurementsDiv = document.getElementById('measurements');
            measurementsDiv.innerHTML = '';

            if (files.length > 0)
            {
                files.forEach((file, index) =>
                {
                    const chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container';

                    const canvas = document.createElement('canvas');
                    const canvasId = 'chart' + (index + 1);
                    canvas.id = canvasId;

                    const deleteIcon = document.createElement('div');
                    deleteIcon.className = 'deleteIcon';
                    deleteIcon.onclick = () => deleteMeasurement(file);

                    chartContainer.appendChild(canvas);
                    chartContainer.appendChild(deleteIcon);
                    measurementsDiv.appendChild(chartContainer);

                    initChart(canvasId, file);
                });
            }
            else
            {
                const label = document.createElement('p');
                label.innerText = "Es existieren noch keine gespeicherten Messungen";
                measurementsDiv.appendChild(label);
            }

        })
        .catch(error =>
        {
            console.error('Fehler beim Abrufen der Messdateiliste:', error);
        });
}

function startSSE()
{
    const eventSource = new EventSource('/liveStream');
    eventSource.onmessage = function (event)
    {
        updateChartWithNewData(event.data);
    };
    eventSource.onerror = function (error)
    {
        console.error("SSE Fehler:", error);
        eventSource.close();
    };
};