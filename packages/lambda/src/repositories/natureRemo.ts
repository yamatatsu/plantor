import fetch from "node-fetch";
import zod from "zod";

/**
 * type Devices = {
 *   name: string;
 *   id: string;
 *   created_at: string;
 *   updated_at: string;
 *   mac_address: string;
 *   serial_number: string;
 *   firmware_version: string;
 *   temperature_offset: number;
 *   humidity_offset: number;
 *   users: [
 *     {
 *       id: string;
 *       nickname: string;
 *       superuser: true;
 *     },
 *   ];
 *   newest_events: Record<EventName, { val: number; created_at: string }>;
 * }[];
 */
type EventName = "hu" | "il" | "te";
type RemoData = {
  name: string;
  newest_events: Record<EventName, { val: number; created_at: string }>;
};
const devicesSchema = zod.array(zod.object({ name: zod.string() }));
const remoDataSchema = zod.object({
  name: zod.string(),
  newest_events: zod.object({
    hu: zod.object({ val: zod.number(), created_at: zod.string() }),
    il: zod.object({ val: zod.number(), created_at: zod.string() }),
    te: zod.object({ val: zod.number(), created_at: zod.string() }),
  }),
});

const eventDic = {
  hu: "humidity",
  il: "illuminance",
  te: "temperature",
} as const;

export type NatureRemoData = {
  name: typeof eventDic[EventName];
  value: number;
  timestamp: Date;
};

export async function getNatureRemoWorkRoomData(
  natureRemoToken: string,
): Promise<NatureRemoData[]> {
  const result = await fetch("https://api.nature.global/1/devices", {
    headers: { Authorization: `Bearer ${natureRemoToken}` },
  });
  const json = await result.json();

  const devices = devicesSchema.parse(json);
  const data = devices.find((d) => d.name === "仕事部屋");
  const remoData = remoDataSchema.parse(data);
  return [
    convert(remoData, "hu"),
    convert(remoData, "il"),
    convert(remoData, "te"),
  ];
}

function convert(data: RemoData, key: keyof typeof eventDic) {
  const event = data.newest_events[key];
  return {
    name: eventDic[key],
    value: event.val,
    timestamp: new Date(event.created_at),
  };
}
