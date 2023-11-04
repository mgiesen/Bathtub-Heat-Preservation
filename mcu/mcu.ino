#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define BME280_I2C_ADDRESS 0x76
#define DS18B20_ONE_WIRE_BUS 2

enum class PROGRAM_MODES
{
    PRINT_SENSOR_ADDRESS,
    DATA_EMULATION,
    MEASURING,
};

PROGRAM_MODES PROGRAM_MODE = PROGRAM_MODES::MEASURING;

Adafruit_BME280 BME280;

OneWire oneWire(DS18B20_ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

DeviceAddress air_temperature = {0x28, 0xFF, 0x0C, 0x4A, 0x60, 0x17, 0x04, 0x2B};
DeviceAddress water_temperature = {0x28, 0xFF, 0x1A, 0x2D, 0x61, 0x17, 0x05, 0x3C};

void printAddress(DeviceAddress deviceAddress)
{
    for (uint8_t i = 0; i < 8; i++)
    {
        if (deviceAddress[i] < 16)
            Serial.print("0");
        Serial.print(deviceAddress[i], HEX);
    }
    Serial.println();
}

void setup()
{
    Serial.begin(9600);

    if (!BME280.begin(BME280_I2C_ADDRESS))
    {
        Serial.println("Konnte BME280 Sensor nicht finden, überprüfe Verkabelung!");
        while (1)
            ;
    }

    sensors.begin();
}

void loop()
{
    if (PROGRAM_MODE == PROGRAM_MODES::PRINT_SENSOR_ADDRESS)
    {
        // Drucke die Adressen der Sensoren am Bus
        DeviceAddress tempDeviceAddress;
        sensors.begin();

        Serial.println("Gefundene DS18B20 Sensor Adressen:");
        Serial.println("---------------------------------------------------");
        for (int i = 0; sensors.getAddress(tempDeviceAddress, i); i++)
        {
            Serial.print("Sensor ");
            Serial.print(i);
            Serial.print(" Adresse: ");
            printAddress(tempDeviceAddress);
        }
        Serial.println("---------------------------------------------------");
        Serial.println("");

        delay(5000);
    }
    else
    {
        // DS18B20 Werte lesen
        sensors.requestTemperatures();
        float temp_air = sensors.getTempC(air_temperature);
        float temp_water = sensors.getTempC(water_temperature);

        // BME280 Werte lesen
        float temp_air_bme = BME280.readTemperature();
        float humidity = BME280.readHumidity();

        // Verwende emulierte Werte
        if (PROGRAM_MODE == PROGRAM_MODES::DATA_EMULATION)
        {
            temp_air = 20;
            temp_water = 37;
            humidity = 60;
            temp_air_bme = 20.4;
        }

        // Daten an Serial Port senden
        Serial.print(temp_water);
        Serial.print(";");
        Serial.print(temp_air);
        Serial.print(";");
        Serial.print(humidity);
        Serial.print(";");
        Serial.println(temp_air_bme);
    }
    delay(1000); // Pause zwischen den Messungen
}
