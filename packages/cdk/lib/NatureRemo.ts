import {
  App,
  Duration,
  Stack,
  StackProps,
  aws_events,
  aws_events_targets,
  aws_stepfunctions,
  aws_stepfunctions_tasks,
  aws_apigateway,
} from "aws-cdk-lib";

type Props = StackProps & {};

export class NatureRemo extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    const remoEndpoint = new aws_apigateway.RestApi(
      this,
      "NatureRemoEndpoint",
      {
        defaultIntegration: new aws_apigateway.HttpIntegration(
          "https://api.nature.global/1/devices",
          {
            options: {
              requestParameters: {
                "integration.request.header.Authorization":
                  "method.request.header.x-Authorization",
              },
            },
          },
        ),
      },
    );
    remoEndpoint.root.addMethod("GET", undefined, {
      requestParameters: { "method.request.header.x-Authorization": true },
    });

    const secretTask = new aws_stepfunctions_tasks.CallAwsService(
      this,
      "GetSecretTask",
      {
        service: "ssm",
        action: "getParameter",
        parameters: { Name: "/plantor/nature-remo-token" },
        iamResources: ["*"],
        iamAction: "ssm:GetParameter",
        resultSelector: {
          "Token.$": "$.Parameter.Value",
        },
        resultPath: "$.SecretOutput",
      },
    );

    const natureRemoTask =
      new aws_stepfunctions_tasks.CallApiGatewayRestApiEndpoint(
        this,
        "CallNatureRemoTask",
        {
          api: remoEndpoint,
          stageName: remoEndpoint.deploymentStage.stageName,
          method: aws_stepfunctions_tasks.HttpMethod.GET,
          headers: aws_stepfunctions.TaskInput.fromObject({
            "x-Authorization": aws_stepfunctions.JsonPath.stringAt(
              "States.Array(States.Format('Bearer {}', $.SecretOutput.Token))",
            ),
          }),
          resultSelector: {
            "Events.$": "$.ResponseBody[1].newest_events",
          },
          resultPath: "$.NatureRemoOutput",
        },
      );

    const tempretureTask = new aws_stepfunctions_tasks.CallAwsService(
      this,
      "PutMetricTask",
      {
        service: "cloudwatch",
        action: "putMetricData",
        parameters: {
          Namespace: "CUSTOM-IoT/Room",
          MetricData: [
            {
              MetricName: "Tempreture",
              Value: aws_stepfunctions.JsonPath.numberAt(
                "$.NatureRemoOutput.Events.te.val",
              ),
            },
            {
              MetricName: "Illuminance",
              Value: aws_stepfunctions.JsonPath.numberAt(
                "$.NatureRemoOutput.Events.il.val",
              ),
            },
            {
              MetricName: "Humidity",
              Value: aws_stepfunctions.JsonPath.numberAt(
                "$.NatureRemoOutput.Events.hu.val",
              ),
            },
          ],
        },
        iamResources: ["*"],
        iamAction: "cloudwatch:PutMetricData",
        resultPath: "$.PutMetricOutput",
      },
    );

    const stateMachine = new aws_stepfunctions.StateMachine(
      this,
      "MyStateMachine",
      {
        definition: secretTask.next(natureRemoTask).next(tempretureTask),
      },
    );

    new aws_events.Rule(this, "ScheduleRule", {
      schedule: aws_events.Schedule.rate(Duration.minutes(60)),
      targets: [new aws_events_targets.SfnStateMachine(stateMachine)],
    });
  }
}
