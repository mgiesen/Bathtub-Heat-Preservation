const fs = require('fs');
const fsPromises = require('fs').promises;

const path = require('path');
const axios = require('axios');
const express = require('express');

const measurements_folder = "./measurements";
const visualization_folder = "./visualization";

const microcontrollerUrl = 'http://showersensor.local';

// ===========================================================================
//                             DATENSAMMLUNG
// ===========================================================================

const bufferFilePath = path.join(__dirname, 'buffer.csv');

let isStreamOpen = false;
let writeStream;

const openConnections = new Set();

function startWriteStream() 
{
    if (writeStream)
    {
        writeStream.end();
    }

    writeStream = fs.createWriteStream(bufferFilePath, { flags: 'a' })
        .on('open', () => { isStreamOpen = true; })
        .on('close', () => { isStreamOpen = false; });
}

function sendToAllClients(data)
{
    openConnections.forEach(client =>
    {
        client.write(`data: ${data}\n\n`);
    });
}

async function retrieveSensorData()
{
    try
    {
        const response = await axios.get(microcontrollerUrl);
        const strData = response.data;
        const timestamp = new Date().toISOString();

        const dataLine = `${timestamp};${strData}\n`;

        if (isStreamOpen)
        {
            writeStream.write(dataLine);
            sendToAllClients(dataLine);
        }
    }
    catch (error) 
    {
        console.error('Fehler beim Abfragen der Daten:', error);
    }
}

startWriteStream();
setInterval(retrieveSensorData, 2500);

process.on('SIGINT', () =>
{
    console.log('Prozess wird beendet, schließe Streams...');
    writeStream.end();
    process.exit();
});

// ===========================================================================
//                    Webserver für Datenvisualisierung
// ===========================================================================

const app = express();

app.use(express.static(visualization_folder));
app.use('/data', express.static(measurements_folder));

app.listen(3000, function ()
{
    console.log('Webserver läuft. Trending auf Port 3000');
});

app.get('/liveData.csv', async (req, res) =>
{
    try
    {
        const data = await fsPromises.readFile(bufferFilePath, 'utf-8');
        res.type('text/csv');
        res.send(data);
    }
    catch (err)
    {
        console.error('Fehler beim Lesen der buffer.csv Datei:', err);
        res.status(500).send('Fehler beim Laden der Live-Daten');
    }
});

app.get('/liveStream', async (req, res) =>
{
    // Header für SSE einstellen
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Bestehende Daten senden
    const initialData = await fsPromises.readFile(bufferFilePath, 'utf-8');
    res.write(`data: ${initialData}\n\n`);

    // Verbindung zu den offenen Verbindungen hinzufügen
    openConnections.add(res);

    // Verbindung beim Schließen entfernen
    req.on('close', () =>
    {
        openConnections.delete(res);
    });
});

app.get('/restart_measurement', (req, res) =>
{
    //writeStream stoppen, um Datei zu löschen
    writeStream.end(() =>
    {
        // Buffer Datei löschen bzw. Zeiger zurücksetzen
        fs.truncate(bufferFilePath, 0, err =>
        {
            if (err)
            {
                console.error('Fehler beim Leeren der buffer.csv Datei:', err);
                res.status(500).send('Fehler beim Neustart der Messung');
                return;
            }

            // writeStream erneut starten
            startWriteStream();

            res.status(200).send('Messung neugestartet.');
        });
    });
});

app.get('/save_measurement', async (req, res) =>
{
    const { filename } = req.query;
    const decodedFilename = decodeURIComponent(filename);

    if (!decodedFilename || path.basename(decodedFilename) !== decodedFilename)
    {
        return res.status(400).send('Ungültiger Dateiname');
    }

    const destinationPath = path.join(measurements_folder, `${decodedFilename}.csv`);

    try
    {
        await fsPromises.copyFile(bufferFilePath, destinationPath);
        res.status(200).send('Messung erfolgreich gespeichert');
    }
    catch (err)
    {
        console.error('Fehler beim Speichern der Datei:', err);
        res.status(500).send('Fehler beim Speichern der Messung');
    }
});

app.get('/delete_measurement', async (req, res) =>
{
    const { filename } = req.query;
    const decodedFilename = decodeURIComponent(filename);

    if (!decodedFilename || path.basename(decodedFilename) !== decodedFilename)
    {
        return res.status(400).send('Ungültiger Dateiname');
    }

    const filePath = path.join(measurements_folder, `${decodedFilename}`);

    try
    {
        await fsPromises.unlink(filePath);
        res.status(200).send('Messung erfolgreich gelöscht');
    } catch (err)
    {
        console.error('Fehler beim Löschen der Datei:', err);
        res.status(500).send('Fehler beim Löschen der Messung');
    }
});

app.get('/list_measurements', async (req, res) =>
{
    try
    {
        const directoryPath = path.join(__dirname, 'measurements');
        const files = await fsPromises.readdir(directoryPath);
        const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
        res.json(csvFiles);
    }
    catch (err)
    {
        console.error('Fehler beim Auflisten der Messungen:', err);
        res.status(500).send('Fehler beim Auflisten der Messungen');
    }
});

