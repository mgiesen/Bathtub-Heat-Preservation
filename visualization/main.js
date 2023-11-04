let liveChart;

// CSV Datei laden
async function loadCSVData(url)
{
    const response = await fetch(url);
    const data = await response.text();
    return data;
}

// CSV-Daten verarbeiten
async function processData(filename) 
{
    const csvData = await loadCSVData(filename);
    const rows = csvData.split('\n');
    const labels = [];
    const datasets = [];

    const columnsInfo = [
        { name: 'Wassertemperatur', unit: '°C', color: '#4e79a7', fill: false, yAxisID: 'y-axis-0', show: false },
        { name: 'Lufttemperatur', unit: '°C', color: '#f28e2b', fill: false, yAxisID: 'y-axis-0', show: false },
        { name: 'Luftfeuchtigkeit', unit: '%', color: '#76b7b2', fill: false, yAxisID: 'y-axis-1', show: true },
        { name: 'Referenztemperatur', unit: '°C', color: '#f5e042', fill: false, yAxisID: 'y-axis-0', show: true },
    ];

    for (let i = 0; i < columnsInfo.length; i++) 
    {
        const columnInfo = columnsInfo[i];

        datasets.push({
            label: `${columnInfo.name} ${columnInfo.unit}`,
            data: [],
            borderColor: columnInfo.color,
            borderWidth: 2,
            fill: columnInfo.fill,
            yAxisID: columnInfo.yAxisID,
        });
    }

    for (let i = 1; i < rows.length; i++)
    {
        const columns = rows[i].split(';');
        const timestampString = columns[0];

        var timestamp = new Date(timestampString);

        if (!isNaN(timestamp.getTime())) 
        {
            var formattedTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp);
            labels.push(formattedTime);
        } else
        {
            labels.push('?');
            console.log(timestampString);
        }

        for (let j = 1; j < columns.length; j++)
        {
            const value = parseFloat(columns[j]);
            if (columnsInfo[j - 1].show)
            {
                datasets[j - 1].data.push(value);
            }
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
    scales: {
        'y-axis-0': {
            position: 'left',
            beginAtZero: false,
            ticks: {
                callback: function (value, index, ticks)
                {
                    return value + ' °C';
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
                callback: function (value, index, ticks)
                {
                    return value + ' %';
                }
            },
            title: {
                display: true,
                text: 'Luftfeuchtigkeit'
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
                updateChart(liveChart, '/live');
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
    } else
    {
        console.log("Das Speichern wurde abgebrochen, kein Dateiname angegeben.");
    }
}

// Laden und Verarbeiten der CSV-Daten für das erste Diagramm
processData('/live').then(data =>
{
    liveChart = createChart('liveChart', undefined, {
        labels: data.labels,
        datasets: data.datasets,
    });

    setInterval(async () =>
    {
        updateChart(liveChart, '/live');
    }, 1000);

});

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
                    chartContainer.appendChild(canvas);
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

document.addEventListener('DOMContentLoaded', listAndFillMeasurements);


