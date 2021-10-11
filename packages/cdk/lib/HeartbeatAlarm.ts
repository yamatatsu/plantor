import { App, Stack, StackProps, aws_iotevents, aws_iam } from "aws-cdk-lib";

type Props = StackProps & {};

export class HeartbeatAlarm extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    enum State {
      Normal = "Normal",
      Error = "Error",
    }

    const timer: aws_iotevents.CfnDetectorModel.SetTimerProperty = {
      timerName: "HeartbeatTimeoutTimer",
      seconds: 60,
    };

    const deviceNameJsonPath = "deviceName";
    const topicInput = new aws_iotevents.CfnInput(this, "TopicInput", {
      inputName: "plantor-topic",
      inputDefinition: {
        attributes: [{ jsonPath: deviceNameJsonPath }],
      },
    });

    const normalCondition = `!isUndefined($input.${topicInput.inputName}.${deviceNameJsonPath})`;

    const normalState = {
      stateName: State.Normal,
      onEnter: {
        events: [
          {
            eventName: "createTimer",
            condition: "true",
            actions: [{ setTimer: timer }],
          },
        ],
      },
      onInput: {
        events: [
          {
            eventName: "inputEvent",
            condition: normalCondition,
            actions: [{ resetTimer: timer }],
          },
        ],
        transitionEvents: [
          {
            eventName: "timerTimeout",
            condition: `timeout("${timer.timerName}")`,
            actions: [{ clearTimer: timer }],
            nextState: State.Error,
          },
        ],
      },
    };
    const errorState = {
      stateName: State.Error,
      onEnter: {
        events: [
          {
            eventName: "testPublish",
            condition: "true",
            actions: [{ iotTopicPublish: { mqttTopic: "testFromIotEvent" } }],
          },
        ],
      },
      onInput: {
        transitionEvents: [
          {
            eventName: "inputArrival",
            condition: normalCondition,
            nextState: State.Normal,
          },
        ],
      },
    };

    new aws_iotevents.CfnDetectorModel(this, "HeartbeatAlarmModel", {
      key: deviceNameJsonPath,
      evaluationMethod: "BATCH",
      roleArn: "", // TODO:
      detectorModelDefinition: {
        initialStateName: State.Normal,
        states: [normalState, errorState],
      },
    });
  }
}
