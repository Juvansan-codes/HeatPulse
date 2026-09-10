# IoT Subsystem (Arduino)

This directory contains the firmware and documentation for the Arduino UNO R4 WiFi based IoT sensor node.

## Responsibilities
- Sensor acquisition (DHT22, UV, optional Light sensor).
- Basic sensor validation.
- Telemetry packaging.
- Sending data to ThingSpeak over Wi-Fi.

**Note:** The Arduino node does NOT calculate Heat Index, WBGT, UTCI, HTSI, or perform any predictive/risk analysis.

## Setup
- IDE: Arduino IDE v2.x
- Board: Arduino UNO R4 WiFi
