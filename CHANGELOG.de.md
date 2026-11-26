# Änderungsprotokoll

## 0.2.1

- Behoben: Die Batterie konnte ein Datum als Ladestand zeigen, etwa „2026 %“ von einem Sensor „Batterie gewechselt“. Als Ladestand zählt jetzt nur eine Zahl in % (oder mit der Geräteklasse Batterie); Datums- und Spannungssensoren werden übergangen.

## 0.2.0

- Der Name kommt jetzt aus dem Gerätenamen statt aus dem Bereich. In der Raumliste fällt ein vorangestelltes „Rauchmelder“ weg.
- Das Batteriesymbol zeigt den Füllstand und das Verbindungssymbol Signalbalken, wenn das Gerät einen Batterie-Prozentwert oder einen Signalsensor hat (Linkqualität, RSSI oder Signalstärke). Die Tooltips nennen die Werte. Neue Optionen `battery_level` und `signal` legen diese Sensoren von Hand fest.

## 0.1.3

- Die Symbolreihen zeigen keine Flamme mehr: Ob Rauch da ist, sagen schon Ring, LED und Statustext. Die Symbole stehen jetzt nur für die Geräteprüfungen (Sensor, Verbindung, Batterie, Lebensdauer), und die Zahl daneben (etwa „4/4 OK“) zählt nur diese.

## 0.1.2

- Raumliste: Eine Problem-Plakette nennt jetzt nur das Problem („Rauch erkannt“ statt „Rauch: Rauch erkannt“).
- Gerät: Auf schmalen Kacheln werden die Symbole kleiner und bleiben in einer Reihe, statt umzubrechen.

## 0.1.1

- Alarm zuerst: Die schmale Zeile zeigt jetzt ein Symbol je Prüfpunkt.
- Der Titel sagt nicht mehr zweimal „Rauchmelder“, wenn der Gerätename das Wort schon enthält.

## 0.1.0

- Erste Version: Stile Gerät, Alarm zuerst und Raumliste; Batterie, Verbindung, Störung und Lebensdauer werden auf dem Gerät des Melders gefunden.
