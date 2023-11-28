#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <OneWire.h>
#include <DallasTemperature.h>

/*
  Definition erfolgt in der "secrets.h"
  const char *ssid;
  const char *password;
*/

#include "secrets.h"

#define BME280_I2C_ADDRESS 0x76
#define DS18B20_ONE_WIRE_BUS 2

Adafruit_BME280 BME280;

OneWire oneWire(DS18B20_ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

DeviceAddress air_temperature = {0x28, 0xFF, 0x0C, 0x4A, 0x60, 0x17, 0x04, 0x2B};
DeviceAddress water_temperature = {0x28, 0xFF, 0x1A, 0x2D, 0x61, 0x17, 0x05, 0x3C};

ESP8266WebServer server(80);

void setup()
{
    Serial.begin(9600);

    if (!BME280.begin(BME280_I2C_ADDRESS))
    {
        Serial.println("Konnte BME280 Sensor nicht finden, überprüfe Verkabelung!");
        while (1)
        {
        };
    }

    sensors.begin();

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.println("Verbindung mit WLAN aufbauen...");
    }

    Serial.println("Mit WLAN verbunden");

    if (!MDNS.begin("showersensor"))
    {
        Serial.println("Fehler beim Einrichten des mDNS-Responders!");
    }
    else
    {
        Serial.println("mDNS responder gestartet");
    }

    MDNS.addService("http", "tcp", 80);

    server.on("/", HTTP_GET, handleSendSensorData);
    server.begin();
    Serial.println("HTTP Server gestartet");
}

void loop()
{
    server.handleClient();
    MDNS.update();
}

void handleSendSensorData()
{
    sensors.requestTemperatures();

    String temp_air = String(sensors.getTempC(air_temperature));
    String temp_water = String(sensors.getTempC(water_temperature));
    String humidity = String(BME280.readHumidity());
    String temp_air_bme = String(BME280.readTemperature());

    // String zusammensetzen
    String dataString = temp_water + ";" + temp_air + ";" + humidity + ";" + temp_air_bme;

    // Daten als Response zurücksenden
    server.send(200, "text/plain", dataString);
}
