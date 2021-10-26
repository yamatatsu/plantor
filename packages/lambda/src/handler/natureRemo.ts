import { ScheduledHandler } from "aws-lambda";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

import { getNatureRemoToken } from "../repositories/natureRemoToken";
import { getNatureRemoWorkRoomData } from "../repositories/natureRemo";

const configuration = { region: "ap-northeast-1" };
const cloudWatchClient = new CloudWatchClient(configuration);

const SECRET_ID = process.env.SECRET_ID;

export const handler: ScheduledHandler = async () => {
  if (!SECRET_ID) {
    throw new Error("環境変数 SECRET_ID が空です。");
  }

  const natureRemoToken = await getNatureRemoToken(SECRET_ID);

  const data = await getNatureRemoWorkRoomData(natureRemoToken);

  await cloudWatchClient.send(
    new PutMetricDataCommand({
      Namespace: "CUSTOM-IoT/Room",
      MetricData: data.map((d) => ({
        MetricName: d.name,
        Value: d.value,
        Timestamp: d.timestamp,
      })),
    }),
  );
};
