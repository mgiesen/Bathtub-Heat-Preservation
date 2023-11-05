# Systemaufbau

Da es für bestimmte Experimente sinnvoll sein kann, die Badezimmertür zu schließen, habe ich die Messung von der Datenspeicherung und Visualisierung getrennt. Somit können die Sensoren im Badezimmer verbleiben, während die Messung von einem dezentralen Computer überwacht werden kann.

## Verwendete Bauteile

| Bauteil                         | Stück | Bezeichnung         | Kosten | Datenblatt                                                                                |
| ------------------------------- | ----- | ------------------- | ------ | ----------------------------------------------------------------------------------------- |
| WiFi Mikrocontroller            | 1     | Wemos D1 Mini       | 4 €    | [Öffnen](https://www.wemos.cc/en/latest/d1/d1_mini_lite.html)                             |
| Temperatur- Feuchtigkeitssensor | 1     | BME280 Module       | 7 €    | [Öffnen](https://www.mouser.com/datasheet/2/783/BST-BME280-DS002-1509607.pdf)             |
| Temperatursensor                | 2     | DS18B20             | 7 €    | [Öffnen](https://www.analog.com/media/en/technical-documentation/data-sheets/ds18b20.pdf) |
| Pullup Widerstand               | 1     | 4,7 kOhm Widerstand | 0,1 €  | -                                                                                         |
| Powerbank oder USB Netzteil     | 1     | -                   | -      | -                                                                                         |
| Server (Computer)               | 1     | -                   | -      | -                                                                                         |

## Schaltbild

![Titel](images/schematic.png)

## Messung

| Schaltsymbol | Ort              | Messgröße                       | Einheit  |
| ------------ | ---------------- | ------------------------------- | -------- |
| IC01         | Raummitte        | Temperatur und Luftfeuchtigkeit | °C und % |
| IC02         | Wasser Badewanne | Temperatur                      | °C       |
| IC03         | Raummitte        | Temperatur                      | °C       |

## Installation

- Repository klonen `git clone https://github.com/mgiesen/Bathtub-Heat-Preservation.git`
- Beliebige IDE für Arduino und ESP8266 Upload voreberiten
- Secrets Datei anlegen `mcu/secrets.h` und WLAN Zugangsdaten eingeben

```cpp
{
    const char *ssid = "xxxx";
    const char *password = "xxxxx";
}
```

- Quellcode auf Microcontroller aus mcu-Ordner hochladen
- NodeJS und npm installieren
- Erforderliche Pakete installieren `npm install`
- Server Skript ausführen `node server.js`
- Beliebigen Browser nutzen, um Webinterface zu öffnen `http://localhost:3000`
