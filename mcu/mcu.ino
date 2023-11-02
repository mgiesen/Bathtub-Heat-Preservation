#include <DHT.h>

// DHT22 Konfiguration
#define DHTPIN 2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// PT100 Pins
#define PT100_PIN1 32
#define PT100_PIN2 33

// Referenzwiderstand PT100 in Ohm
#define RREF 430.0

// MOCKUP MODE
#define MOCKUP true

void setup()
{
    Serial.begin(9600);
    dht.begin();
}

float calculateTemperature(float rawValue)
{
    float Rpt100 = RREF * (rawValue / (4095.0 - rawValue));
    float temperature = -242.02 + sqrt(5903.21 + 2.0 * 2.90802e-4 * Rpt100);
    return temperature;
}

void loop()
{
    // PT100 Werte lesen und in Temperatur umrechnen
    float rawValue1 = analogRead(PT100_PIN1);
    float temp1 = MOCKUP ? 37 : calculateTemperature(rawValue1);

    float rawValue2 = analogRead(PT100_PIN2);
    float temp2 = MOCKUP ? 20 : calculateTemperature(rawValue2);

    // DHT22 lesen
    float humid = MOCKUP ? 60 : dht.readHumidity();

    // Daten an Serial Port senden
    if (isnan(humid) == false || MOCKUP)
    {

        Serial.print(temp1);
        Serial.print(";");
        Serial.print(temp2);
        Serial.print(";");
        Serial.println(humid);
    }
    else
    {
        Serial.println("Fehler beim Lesen des DHT-Sensors");
    }

    delay(1000); // Pause zwischen den Messungen
}
