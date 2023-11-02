// CSV Datei laden
async function loadCSVData(filename)
{
    const response = await fetch(`/data/${filename}`);
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
        { name: 'Wassertemperatur', unit: '°C', color: '#4e79a7', fill: false, yAxisID: 'y-axis-0', show: true },
        { name: 'Lufttemperatur', unit: '°C', color: '#f28e2b', fill: false, yAxisID: 'y-axis-0', show: true },
        { name: 'Luftfeuchtigkeit', unit: '%', color: '#76b7b2', fill: false, yAxisID: 'y-axis-1', show: true },
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
        const columns = rows[i].split(',');
        const timestampString = columns[0];

        var timestamp = new Date(timestampString);

        if (!isNaN(timestamp.getTime())) 
        {
            var formattedTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp);
            labels.push(formattedTime);
        } else
        {
            labels.push('?');
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
    scales: {
        x: [{
            ticks: {
                display: false,
            },
        }],
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
        }
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

    const options = { ...chartOptions };
    options.plugins.title.text = title;

    return new Chart(ctx, {
        type: 'line',
        data,
        options: options,
    });
}

// Laden und Verarbeiten der CSV-Daten für das erste Diagramm
processData('measurement_shower.csv').then(data =>
{
    const chart1 = createChart('chart1', 'Wasser aufgestaut', {
        labels: data.labels,
        datasets: data.datasets,
    });
});

// Laden und Verarbeiten der CSV-Daten für das zweite Diagramm
processData('measurement_impound.csv').then(data =>
{
    const chart2 = createChart('chart2', 'Normales Duschen', {
        labels: data.labels,
        datasets: data.datasets,
    });
});
