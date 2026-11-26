# Changelog

## 0.2.0

- The name now comes from the device name instead of the area. In the room list a leading "Smoke detector" is left out.
- The battery icon shows the fill level and the connection icon shows signal bars, when the device has a battery percentage or a signal sensor (link quality, RSSI or signal strength). The tooltips give the values. New options `battery_level` and `signal` set these sensors by hand.

## 0.1.3

- The icon rows no longer show a flame: whether there is smoke is what the ring, the LED and the status text already say. The icons now only cover the device checks (sensor, connection, battery, lifetime), and the count next to them (for example "4/4 OK") counts just these.

## 0.1.2

- Room list: a problem badge now just names the problem ("Smoke detected" instead of "Smoke: Smoke detected").
- Device: on narrow tiles the check icons shrink and stay in one row instead of wrapping.

## 0.1.1

- Alert first: the slim line now shows an icon for each check.
- The title no longer says "Smoke detector" twice when the device name already contains it.

## 0.1.0

- First version: styles device, alert first and room list; battery, connection, fault and end of life are found on the detector's device.
