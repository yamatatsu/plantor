# Plantor

## MQTT Topic Name

- 基本的に kebab-case を用いる。
- 第一レベルに`plantor`をつける。MQTT Topic は 1 つの AWS アカウント内で共有されるので。

```
plantor/${deviceName}/${sensorType}/${sensorSerial}
```

example:

```
plantor/wio-terminal-01/moisture/001
```
