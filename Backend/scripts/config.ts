import {
  mnemonicToSecretKey,
  generateAccount,
  getApplicationAddress,
} from "algosdk";
import * as dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();
const ADMIN_MNEMONIC = String(process.env.ADMIN_MNEMONIC);
export const API_KEY = String(process.env.API_KEY);
const APP_ID = Number(process.env.APP_ID);
export const user = mnemonicToSecretKey(ADMIN_MNEMONIC);
export const player = mnemonicToSecretKey(
  "tuna task minimum either please faculty sport regret seven motor hard hold diary flight distance around carry legend alpha budget decorate office chuckle absent rough"
);
export const appId = APP_ID;
export const appAddr = getApplicationAddress(APP_ID);
export const randomnessBeaconContract = 110096026;
export const REDIS_PASSWORD = String(process.env.REDIS_PASSWORD);
export const REDIS_HOST = String(process.env.REDIS_HOST);
export const REDIS_USERNAME = String(process.env.REDIS_USERNAME);
export const REDIS_PORT = Number(process.env.REDIS_PORT);
export const MODE = String(process.env.MODE);

export async function initRedis() {
  var client;
  if (MODE == "PRODUCTION") {
    client = createClient({
      url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`, //comment out if not in production
    });
  } else {
    client = createClient({
      // url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`, //comment out if not in production
    });
  }

  client.on("error", (err) => console.log(err));
  await client.connect();
  return client;
}
