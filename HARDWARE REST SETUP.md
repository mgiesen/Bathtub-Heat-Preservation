# Verwendete Bauteile

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
