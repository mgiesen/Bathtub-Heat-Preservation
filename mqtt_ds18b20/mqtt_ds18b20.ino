#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

const int oneWireBus = 4;

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
const char *mqtt_topic = "shower_experiment/DS18B20/temperatur";

WiFiClient espClient;
PubSubClient client(espClient);

OneWire oneWire(oneWireBus);
DallasTemperature sensors(&oneWire);

void setup()
{
  Serial.begin(9600);

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

  sensors.requestTemperatures();
  float temperatureCelsius = sensors.getTempCByIndex(0);

  Serial.print("Temperatur: ");
  Serial.print(temperatureCelsius);
  Serial.println("°C");

  // Sende die Temperatur zum MQTT-Broker
  String payload = String(temperatureCelsius);
  client.publish(mqtt_topic, payload.c_str());

  delay(10000); 
}

void callback(char *topic, byte *payload, unsigned int length)
{
  //Platzhalter, falls zukünftig benötigt
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.println("Verbindung zum MQTT-Broker wird hergestellt...");
    if (client.connect("mqtt_ds18b20", mqtt_username, mqtt_password))
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
