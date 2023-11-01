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

void setup()
{
    Serial.begin(115200);
    analogSetBits(12); // Setze die Auflösung auf 12 Bits
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
    float temp1 = calculateTemperature(rawValue1);

    float rawValue2 = analogRead(PT100_PIN2);
    float temp2 = calculateTemperature(rawValue2);

    // DHT22 lesen
    float temp3 = dht.readTemperature();
    float humid = dht.readHumidity();

    // Überprüfen, ob DHT-Werte gültig sind
    if (isnan(temp3) || isnan(humid))
    {
        Serial.println("Fehler beim Lesen des DHT-Sensors");
    }
    else
    {
        // Daten an Serial Port senden
        Serial.print(temp1);
        Serial.print(";");
        Serial.print(temp2);
        Serial.print(";");
        Serial.print(temp3);
        Serial.print(";");
        Serial.println(humid);
    }

    delay(1000); // Pause zwischen den Messungen
}
