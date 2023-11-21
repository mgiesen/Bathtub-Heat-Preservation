#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

/*
  Definition erfolgt in der "secrets.h"
  const char *ssid;
  const char *password;
  const char *mqtt_username;
  const char *mqtt_password;
*/

#include "secrets.h"

const char *mqtt_server = "192.168.178.7";
const int mqtt_port = 1883;
const char *mqtt_topic_temp_bme280 = "shower_experiment/multi/temperatur_bme280";
const char *mqtt_topic_humidity_bme280 = "shower_experiment/multi/luftfeuchtigkeit";
const char *mqtt_topic_pressure_bme280 = "shower_experiment/multi/luftdruck";
const char *mqtt_topic_temp_ds18b20 = "shower_experiment/multi/temperatur_ds18b20";

WiFiClient espClient;
PubSubClient client(espClient);

Adafruit_BME280 BME280;
OneWire oneWire(2); 
DallasTemperature sensors(&oneWire);

void setup()
{
  Serial.begin(9600);

  if (!BME280.begin(0x76))
  {
    Serial.println("Konnte BME280-Sensor nicht finden!");
    while (1)
      ;
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Verbindung zum Netzwerk wird hergestellt...");
  }
  Serial.println("Erfolgreich mit Netzwerk verbunden");

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  reconnect();

  sensors.begin();
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }

  client.loop();

  // BME280-Messwerte
  float temperatureCelsius_bme280 = BME280.readTemperature();
  float humidity_bme280 = BME280.readHumidity();
  float pressure_bme280 = BME280.readPressure() / 100.0F; // Umrechnung in hPa

  Serial.print("BME280 - Temperatur: ");
  Serial.print(temperatureCelsius_bme280);
  Serial.println("°C");

  Serial.print("BME280 - Luftfeuchtigkeit: ");
  Serial.print(humidity_bme280);
  Serial.println("%");

  Serial.print("BME280 - Luftdruck: ");
  Serial.print(pressure_bme280);
  Serial.println("hPa");

  // DS18B20-Messwerte
  sensors.requestTemperatures();
  float temperatureCelsius_ds18b20 = sensors.getTempCByIndex(0);

  Serial.print("DS18B20 - Temperatur: ");
  Serial.print(temperatureCelsius_ds18b20);
  Serial.println("°C");

  // Sende die Messwerte zum MQTT-Broker
  client.publish(mqtt_topic_temp_bme280, String(temperatureCelsius_bme280).c_str());
  client.publish(mqtt_topic_humidity_bme280, String(humidity_bme280).c_str());
  client.publish(mqtt_topic_pressure_bme280, String(pressure_bme280).c_str());
  client.publish(mqtt_topic_temp_ds18b20, String(temperatureCelsius_ds18b20).c_str());

  delay(10000); 
}

void callback(char *topic, byte *payload, unsigned int length)
{
  // Platzhalter, falls zukünftig benötigt
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.println("Verbindung zum MQTT-Broker wird hergestellt...");
    if (client.connect("mqtt_combined", mqtt_username, mqtt_password))
    {
      Serial.println("Erfolgreich mit dem MQTT-Broker verbunden");
    }
    else
    {
      Serial.print("Fehler beim Verbinden mit MQTT-Broker, rc=");
      Serial.print(client.state());
      Serial.println(" Nächster Versuch in 5 Sekunden...");
      delay(5000);
    }
  }
}
