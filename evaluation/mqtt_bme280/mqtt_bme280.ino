#include <Wire.h>
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
const char *mqtt_topic_temp = "shower_experiment/BME280/temperatur";
const char *mqtt_topic_humidity = "shower_experiment/BME280/luftfeuchtigkeit";
const char *mqtt_topic_pressure = "shower_experiment/BME280/luftdruck";

WiFiClient espClient;
PubSubClient client(espClient);

Adafruit_BME280 BME280;

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
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }

  client.loop();

  float temperatureCelsius = BME280.readTemperature();
  float humidity = BME280.readHumidity();
  float pressure = BME280.readPressure() / 100.0F; // Umrechnung in hPa

  Serial.print("Temperatur: ");
  Serial.print(temperatureCelsius);
  Serial.println("°C");

  Serial.print("Luftfeuchtigkeit: ");
  Serial.print(humidity);
  Serial.println("%");

  Serial.print("Luftdruck: ");
  Serial.print(pressure);
  Serial.println("hPa");

  // Sende die Messwerte zum MQTT-Broker
  client.publish(mqtt_topic_temp, String(temperatureCelsius).c_str());
  client.publish(mqtt_topic_humidity, String(humidity).c_str());
  client.publish(mqtt_topic_pressure, String(pressure).c_str());

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
    if (client.connect("mqtt_bme280", mqtt_username, mqtt_password))
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
