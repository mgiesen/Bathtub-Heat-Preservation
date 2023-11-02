const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const experiment_1 = false;

// CSV-Writer
const csvWriter = createCsvWriter({
    path: './data/' + (experiment_1 ? 'measurement_shower' : 'measurement_impound') + '.csv',
    header: [
        { id: 'Zeit', title: 'Zeitstempel' },
        { id: 'temp_water', title: 'Wassertemperatur' },
        { id: 'temp_air', title: 'Lufttemperatur' },
        { id: 'hum_dht', title: 'Luftfeuchtigkeit' }
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
        const [temp1, temp2, humid] = strData.split(';');

        // Überprüfen, ob Daten gültig sind
        if (!isNaN(temp1) && !isNaN(temp2) && !isNaN(humid))
        {
            const time = new Date().toISOString();

            // In CSV-Datei schreiben
            csvWriter.writeRecords([{ Zeit: time, temp_water: temp1, temp_air: temp2, hum_dht: humid }])
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
