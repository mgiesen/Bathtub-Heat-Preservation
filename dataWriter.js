const fs = require('fs').promises;
const path = require('path');

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Pfade
const measurements_folder = "./measurements";
const visualization_folder = "./visualization";

// Live Data
let liveData = "";

// Webserver 
const express = require('express');
const app = express();

app.use(express.static(visualization_folder));
app.use('/data', express.static(measurements_folder));

app.listen(3000, function ()
{
    console.log('Webserver läuft. Trending auf Port 3000');
});

app.get('/live', (req, res) =>
{
    res.type('text/csv');
    res.send(liveData);
});

app.get('/restart_measurement', (req, res) =>
{
    liveData = "";
    res.status(200).send();
});

app.get('/save_measurement', async (req, res) =>
{
    const { filename } = req.query;
    const decodedFilename = decodeURIComponent(filename);

    if (!decodedFilename || path.basename(decodedFilename) !== decodedFilename)
    {
        return res.status(400).send('Ungültiger Dateiname');
    }

    const filePath = path.join(measurements_folder, `${decodedFilename}.csv`);

    try
    {
        await fs.writeFile(filePath, liveData);
        res.status(200).send();
    } catch (err)
    {
        console.error('Fehler beim Speichern der Datei:', err);
        res.status(500).send('Fehler beim Speichern der Messung');
    }
});


app.get('/list_measurements', async (req, res) =>
{
    try
    {
        const directoryPath = path.join(__dirname, 'measurements');
        const files = await fs.readdir(directoryPath);
        const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
        res.json(csvFiles);
    }
    catch (err)
    {
        console.error('Fehler beim Auflisten der Messungen:', err);
        res.status(500).send('Fehler beim Auflisten der Messungen');
    }
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
        const timestamp = new Date().toISOString();

        liveData += timestamp + ";" + strData + "\n";
    });
});
