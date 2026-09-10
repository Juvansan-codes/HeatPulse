// SIH 2026 - Heatwave Early Warning IoT Sensor Node
// Phase 0: Skeleton

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }
  Serial.println("SIH 2026 Heatwave Sensor Node Initialized.");
  // Setup code for sensors (DHT22, UV) and WiFi will be added in Phase 8
}

void loop() {
  // Main telemetry loop will go here
  delay(10000); // placeholder delay
}
