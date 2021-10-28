import {
  App,
  Duration,
  Stack,
  StackProps,
  aws_events,
  aws_events_targets,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
  aws_apigateway,
} from "aws-cdk-lib";

type Props = StackProps & {};

export class NatureRemo extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    const remoEndpoint = this.natureRemoEndpoint();

    const taskToGetSecret = new tasks.CallAwsService(this, "GetSecretTask", {
      service: "ssm",
      action: "getParameter",
      parameters: { Name: "/plantor/nature-remo-token" },
      iamResources: ["*"],
      iamAction: "ssm:GetParameter",
      resultSelector: {
        "Token.$": "$.Parameter.Value",
      },
      resultPath: "$.SecretOutput",
    });

    const taskToCallApi = new tasks.CallApiGatewayRestApiEndpoint(
      this,
      "CallNatureRemoTask",
      {
        api: remoEndpoint,
        stageName: remoEndpoint.deploymentStage.stageName,
        method: tasks.HttpMethod.GET,
        headers: sfn.TaskInput.fromObject({
          "x-Authorization": sfn.JsonPath.stringAt(
            /**
             * ドキュメントでは「Listでもいいよ」みたいに書いてあるけど、実際には配列じゃないと実行時エラーになる。
             * なので `States.Array()` が必要。
             * @see https://docs.aws.amazon.com/step-functions/latest/dg/connect-api-gateway.html
             */
            "States.Array(States.Format('Bearer {}', $.SecretOutput.Token))",
          ),
        }),
        resultSelector: {
          "Events.$": "$.ResponseBody[1].newest_events",
        },
        resultPath: "$.NatureRemoOutput",
      },
    );

    const taskToPutMetric = new tasks.CallAwsService(this, "PutMetricTask", {
      service: "cloudwatch",
      action: "putMetricData",
      parameters: {
        Namespace: "CUSTOM-IoT/Room",
        MetricData: [
          {
            MetricName: "Temperature",
            Value: sfn.JsonPath.numberAt("$.NatureRemoOutput.Events.te.val"),
          },
          {
            MetricName: "Illuminance",
            Value: sfn.JsonPath.numberAt("$.NatureRemoOutput.Events.il.val"),
          },
          {
            MetricName: "Humidity",
            Value: sfn.JsonPath.numberAt("$.NatureRemoOutput.Events.hu.val"),
          },
        ],
      },
      iamResources: ["*"],
      iamAction: "cloudwatch:PutMetricData",
      resultPath: "$.PutMetricOutput",
    });

    const stateMachine = new sfn.StateMachine(this, "MyStateMachine", {
      definition: taskToGetSecret.next(taskToCallApi).next(taskToPutMetric),
    });

    new aws_events.Rule(this, "ScheduleRule", {
      schedule: aws_events.Schedule.rate(Duration.minutes(60)),
      targets: [new aws_events_targets.SfnStateMachine(stateMachine)],
    });
  }

  /**
   * 後ろ側にnatureRemoのAPIを設定したAPI Gateway
   */
  private natureRemoEndpoint() {
    /**
     * Step Functions の API Gateway Integration は Authorization header が使えない。
     * そのため、カスタムヘッダーに入れて、API Gateway側で request parameter mappingしてあげるワークアラウンドを実装している。
     * @see https://docs.aws.amazon.com/step-functions/latest/dg/connect-api-gateway.html#connect-api-gateway-requests
     */
    const xAuthorization = "method.request.header.x-Authorization";

    const remoEndpoint = new aws_apigateway.RestApi(
      this,
      "NatureRemoEndpoint",
      {
        defaultIntegration: new aws_apigateway.HttpIntegration(
          "https://api.nature.global/1/devices",
          {
            options: {
              requestParameters: {
                "integration.request.header.Authorization": xAuthorization,
              },
            },
          },
        ),
      },
    );
    remoEndpoint.root.addMethod("GET", undefined, {
      requestParameters: { [xAuthorization]: true },
    });

    return remoEndpoint;
  }
}
