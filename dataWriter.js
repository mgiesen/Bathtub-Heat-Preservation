const SerialPort = require('serialport');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Konfiguriere CSV-Writer
const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: ['Zeit', 'temp_water', 'temp_air', 'temp_air_dht', 'hum_dht']
});

// Port und Baudrate ändern
const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600 });

port.on('data', (data) =>
{
    const strData = data.toString();
    const [temp1, temp2, temp3, humid] = strData.split(';');

    // Überprüfen, ob Daten gültig sind
    if (!isNaN(temp1) && !isNaN(temp2) && !isNaN(temp3) && !isNaN(humid))
    {
        const time = new Date().toISOString();

        // In CSV-Datei schreiben
        csvWriter.writeRecords([{ temp_water: time, temp_water: temp1, temp_air: temp2, temp_air_dht: temp3, hum_dht: humid }])
            .then(() =>
            {
                console.log('Daten geschrieben.');
            });
    }
});
