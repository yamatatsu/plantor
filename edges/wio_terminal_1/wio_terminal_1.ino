#include "rpcWiFi.h"
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"
#include "TFT_eSPI.h"

TFT_eSPI tft = TFT_eSPI();
TFT_eSprite spr = TFT_eSprite(&tft);  // Sprite 
 
const int pinTempSensor = A0;     // Grove - Temperature Sensor connect to A0

WiFiClientSecure https_client;
PubSubClient mqtt_client(https_client);

/**
 * WiFiアクセスポイントへ接続
 **/
void connect_wifi() {
  tft.print("Connecting to ");
  tft.println(ssid);

  tft.print(".");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  tft.print(".");
  
  delay(1000);
  tft.print(".");
  WiFi.begin(ssid, password);
  tft.print(".");

  while (WiFi.status() != WL_CONNECTED) {
    tft.print(".");
    delay(500);
  }
  tft.println("WiFi Connected");
  tft.printf("IPv4: %s", WiFi.localIP().toString().c_str());
}

/**
 * WiFiアクセスポイントへの再接続
 **/
void reconnect_wifi() {
  if (WiFi.status() != WL_CONNECTED) {
    connect_wifi();
  }
}

/**
 * MQTT接続の初期化
 **/
void init_mqtt() {
  https_client.setCACert(AWS_CERT_CA);
  https_client.setCertificate(AWS_CERT_CRT);
  https_client.setPrivateKey(AWS_CERT_PRIVATE);
  mqtt_client.setServer(AWS_IOT_ENDPOINT, 8883);
}

/**
 * AWS IoTへの接続を試行
 **/
void connect_awsiot() {
  reconnect_wifi();

  while (!mqtt_client.connected()) {
    tft.print("Attempting MQTT connection...");
    if (mqtt_client.connect(THINGNAME)) {
      tft.println("connected");
    } else {
      tft.printf("failed, rc=%d", mqtt_client.state());
      tft.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  tft.begin();
  tft.setRotation(3);
  spr.createSprite(TFT_HEIGHT,TFT_WIDTH);

  connect_wifi();
  init_mqtt();
  connect_awsiot();

  pinMode(pinTempSensor, INPUT);
}
 
void loop() {
  connect_awsiot();

  spr.fillSprite(TFT_DARKCYAN);

  int sensorValue = analogRead(pinTempSensor);

  StaticJsonDocument<200> json_document;
  char json_string[100];
  json_document["moisture"] = sensorValue;
  json_document["thing"] = THINGNAME;
  serializeJson(json_document, json_string);

  mqtt_client.publish(topic, json_string);

  delay(60 * 60 * 1000);

  // For calibration
//  tft.print(sensorValue);
//  tft.print(".");
//  delay(5 * 1000);
}
