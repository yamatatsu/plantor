import {
  App,
  Stack,
  StackProps,
  aws_iot,
  RemovalPolicy,
  aws_logs,
  aws_iam,
  aws_s3,
} from "aws-cdk-lib";

type Props = StackProps & {};

export class IotRule extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    const bucket = new aws_s3.Bucket(this, "Bucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    const logGroup = new aws_logs.LogGroup(this, "MyLogGroup", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const role = new aws_iam.Role(this, "Role", {
      assumedBy: new aws_iam.ServicePrincipal("iot.amazonaws.com"),
    });
    bucket.grantPut(role, "*");
    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
      }),
    );
    logGroup.grant(
      role,
      "logs:CreateLogStream",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
    );

    new aws_iot.CfnTopicRule(this, "moisture_rule", {
      ruleName: "moisture_rule",
      topicRulePayload: {
        awsIotSqlVersion: "2016-03-23",
        sql: q(`
          SELECT
            moisture,
            timestamp() as timestamp,
            topic(2) as deviceName,
            topic(3) + topic(4) as sensorName,
            *
          FROM 'plantor/+/moisture/+'
        `),
        actions: [
          {
            s3: {
              bucketName: bucket.bucketName,
              key: "${topic(3)}/${topic(4)}/${timestamp()}",
              roleArn: role.roleArn,
            },
          },
          {
            cloudwatchMetric: {
              metricName: "${topic(3) + topic(4)}",
              metricNamespace: "CUSTOM-IoT/Moisture",
              metricTimestamp: "${timestamp() / 1000}",
              metricUnit: "None",
              metricValue: "${moisture}",
              roleArn: role.roleArn,
            },
          },
        ],
        errorAction: {
          cloudwatchLogs: {
            logGroupName: logGroup.logGroupName,
            roleArn: role.roleArn,
          },
        },
      },
    });
  }
}

function q(query: string): string {
  return query.replace(/\n/g, " ").replace(/ +/g, " ");
}
