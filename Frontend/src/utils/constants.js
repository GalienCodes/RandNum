import { Algodv2 } from "algosdk";

export const ALGOD_CLIENT = {
  testnet: new Algodv2("", "https://node.testnet.algoexplorerapi.io/", ""),
  mainnet: new Algodv2("", "https://node.algoexplorerapi.io/", ""),
};

export const AXIOS_OPTIONS = {
  baseURL: "",
  timeout: 30000,
};
