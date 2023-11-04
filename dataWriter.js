const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Pfade
const measurements_folder = "./measurements";
const visualization_folder = "./visualization";

// Webserver 
const express = require('express');
const app = express();

app.use(express.static(visualization_folder));
app.use('/data', express.static(measurements_folder));

const server = app.listen(3000, function ()
{
    console.log('Webserver läuft. Trending auf Port 3000');
});

// CSV-Writer
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    fieldDelimiter: ';',
    path: './measurements/' + (true ? 'measurement_shower' : 'measurement_impound') + '.csv',
    header: [
        { id: 'timestamp', title: 'Zeitstempel' },
        { id: 'temp_water', title: 'Wassertemperatur' },
        { id: 'temp_air', title: 'Lufttemperatur' },
        { id: 'hum_bme', title: 'Luftfeuchtigkeit' },
        { id: 'temp_air_bme', title: 'Referenztemperatur' }
    ]
});

// Port und Baudrate
const portPath = '/dev/tty.usbserial-22310';
const serialPort = new SerialPort({ path: portPath, baudRate: 9600 });
const parser = serialPort.pipe(new ReadlineParser());

serialPort.on("open", function ()
{
    console.log('Serieller Port geöffnet');

    serialPort.on('error', (err) =>
    {
        console.error(`Fehler: ${err.message}`);
    });

    parser.on("data", function (data)
    {
        const strData = data.toString();
        const [temp_water, temp_air, hum_bme, temp_air_bme] = strData.split(';');

        // Überprüfen, ob Daten gültig sind
        if (!isNaN(temp_water) && !isNaN(temp_air) && !isNaN(hum_bme) && !isNaN(temp_air_bme))
        {
            const timestamp = new Date().toISOString();

            // In CSV-Datei schreiben
            csvWriter.writeRecords([{ timestamp: timestamp, temp_water: temp_water, temp_air: temp_air, hum_bme: hum_bme, temp_air_bme: temp_air_bme }])
                .then(() =>
                {
                    console.log('Neue Datenzeile gespeichert');
                }).catch(err =>
                {
                    console.error('Fehler beim Schreiben in die CSV-Datei:', err);
                });
        }
    });
});
