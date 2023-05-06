import {
  ABIAddressType,
  ABITupleType,
  ABIUintType,
  Account,
  Algodv2,
  decodeObj,
  encodeUnsignedTransaction,
  makePaymentTxnWithSuggestedParamsFromObject,
  Transaction,
  waitForConfirmation,
} from "algosdk";
import {
  encodeUint64,
  getApplicationAddress,
  makeApplicationNoOpTxn,
  ABIContract,
  AtomicTransactionComposer,
  ABIMethod,
  Indexer,
} from "algosdk";
import { decode, encode } from "@msgpack/msgpack";
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { API_KEY, appAddr, appId } from "./config";

// // create client object to connect to sandbox's algod client

// const algodToken =
//   "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
// const algodServer = "http://localhost";

const token = {
  "X-API-Key": API_KEY,
};
const algodServer = "https://testnet-algorand.api.purestake.io/ps2";
const indexerServer = "https://testnet-algorand.api.purestake.io/idx2";

const algodPort = "";
const indexerPort = "";
export const algodClient = new Algodv2(token, algodServer, algodPort);
export const algoIndexer = new Indexer(token, indexerServer, indexerPort);

// Read in the local contract.json file
const buff = readFileSync("contracts/contract.json");

// Parse the json file into an object, pass it to create an ABIContract object
const contract = new ABIContract(JSON.parse(buff.toString()));

export function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function cache<T>(
  key: string,
  callbackInputs: any[],
  expireIn: number,
  callbackFn: any,
  client: any
): Promise<T> {
  async function run() {
    const cachedResponse = await client.get(key);
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }
    const result = await callbackFn(...callbackInputs);
    await client.set(key, JSON.stringify(result), { EX: expireIn * 60 });
    return result;
  }
  return run();
}

// Utility function to return an ABIMethod by its name
export function getMethodByName(name: string): ABIMethod {
  const m = contract.methods.find((mt: ABIMethod) => {
    return mt.name == name;
  });
  if (m === undefined) throw Error("Method undefined: " + name);
  return m;
}
export async function submitTransaction(
  txn: Transaction,
  sk: Uint8Array
): Promise<string> {
  const signedTxn = txn.signTxn(sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  await waitForConfirmation(algodClient, txId, 1000);
  return txId;
}

export function compilePyTeal(path: string): string {
  const pythonProcess = spawnSync(
    "/Users/jaybee/Desktop/Code/Algorand/Smart-ASA/venv/bin/python3",
    [`${path}.py`]
  );
  if (pythonProcess.stderr) console.log(pythonProcess.stderr.toString());
  return pythonProcess.stdout.toString();
}

export async function compileTeal(programSource: string): Promise<Uint8Array> {
  //@ts-ignore
  const enc = new TextEncoder();
  const programBytes = enc.encode(programSource);
  const compileResponse = await algodClient.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
}

export function encodeTxn(txn: Transaction) {
  const encoded = encodeUnsignedTransaction(txn);
  //@ts-ignore
  return Array.from(encoded);
}

export async function sendAlgo(
  senderaccount: Account,
  receiverAddr: string,
  amount: number
) {
  let params = await algodClient.getTransactionParams().do();
  const enc = new TextEncoder();
  const note = enc.encode("Hello");
  let txn = makePaymentTxnWithSuggestedParamsFromObject({
    from: senderaccount.addr,
    to: receiverAddr,
    amount: amount,
    suggestedParams: params,
    note: note,
  });
  const txId = await submitTransaction(txn, senderaccount.sk);
  return txId;
}

//fetches and decodes the logs returned in the transaction Hash
export async function getTransactionReference(txId: string) {
  const transaction = await algoIndexer
    .lookupApplicationLogs(appId)
    .txid(txId)
    .do();

  const encoded: string = transaction["log-data"][0]["logs"][0];
  var d = Buffer.from(encoded, "base64");
  const returnedType = Array(12).fill(new ABIUintType(64));
  returnedType[9] = new ABIAddressType();
  const tupleType = new ABITupleType(returnedType);
  return {
    decoded: tupleType.decode(new Uint8Array(d).slice(4)),
    caller: transaction["sender"],
    round: transaction["confirmed-round"],
  };
}

export async function checkUserOptedIn(userAddr: string, appId: number) {
  let response = [];
  var data = await algoIndexer.lookupAccountAppLocalStates(userAddr).do();
  var nextToken = data["next-token"];
  var dataLength = data["apps-local-states"].length;
  //@ts-ignore
  response.push(...data["apps-local-states"]);
  while (dataLength > 0) {
    var data = await algoIndexer
      .lookupAccountAppLocalStates(userAddr)
      .nextToken(nextToken)
      .do();

    nextToken = data["next-token"];
    dataLength = data["apps-local-states"].length;
    //@ts-ignore
    response.push(...data["apps-local-states"]);
  }
  return response.find((localState: any) => localState.id == appId);
}

//add while loop to this to include next token
//This only fetches app calls
export async function getUserTransactionstoApp(
  userAddr: string,
  appId: number
) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .address(userAddr)
    .applicationID(appId)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    data = await algoIndexer
      .searchForTransactions()
      .address(userAddr)
      .applicationID(appId)
      .nextToken(nextToken)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return txns;
}

export async function getUserTransactionstoAppBetweenRounds(
  userAddr: string,
  appId: number,
  minRound: number,
  maxRound: number
) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .address(userAddr)
    .applicationID(appId)
    .minRound(minRound)
    .maxRound(maxRound)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .address(userAddr)
      .applicationID(appId)
      .nextToken(nextToken)
      .minRound(minRound)
      .maxRound(maxRound)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return txns;
}

export async function getAppPayTransactions(
  appAddr: string,
  notePrefix?: string
) {
  const txns = [];
  var data = await algoIndexer.searchForTransactions().address(appAddr).do();

  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .address(appAddr)
      .nextToken(nextToken)
      .do();

    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return notePrefix == undefined
    ? txns
    : txns.filter((txn) => txn.note == notePrefix);
}

export async function getAppPayTransactionsBetweenRounds(
  appAddr: string,
  minRound: number,
  maxRound: number,
  notePrefix?: string
) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .address(appAddr)
    .minRound(minRound)
    .maxRound(maxRound)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .address(appAddr)
      .nextToken(nextToken)
      .minRound(minRound)
      .maxRound(maxRound)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return notePrefix == undefined
    ? txns
    : txns.filter((txn) => txn.note == notePrefix);
}

export async function getAppPayTransactionsFromRound(
  appAddr: string,
  minRound: number,
  notePrefix?: string
) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .address(appAddr)
    .minRound(minRound)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .address(appAddr)
      .minRound(minRound)
      .nextToken(nextToken)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return notePrefix == undefined
    ? txns
    : txns.filter((txn) => txn.note == notePrefix);
}

export async function getAppCreateGameTransactions(appAddr: string) {
  const enc = new TextEncoder();
  const txns = await getAppPayTransactions(
    appAddr,
    Buffer.from(enc.encode("init_game")).toString("base64")
  );
  return txns;
}

export async function getAppCreateGameTransactionsBetweenRounds(
  appAddr: string,
  minRound: number,
  maxRound: number
) {
  const enc = new TextEncoder();
  const txns = await getAppPayTransactionsBetweenRounds(
    appAddr,
    minRound,
    maxRound,
    Buffer.from(enc.encode("init_game")).toString("base64")
  );
  return txns;
}

export async function getAppCreateGameTransactionsFromRound(
  appAddr: string,
  minRound: number
) {
  const enc = new TextEncoder();
  const txns = await getAppPayTransactionsFromRound(
    appAddr,
    minRound,
    Buffer.from(enc.encode("init_game")).toString("base64")
  );
  return txns;
}

export async function getAppEnterGameTransactions(appAddr: string) {
  const enc = new TextEncoder();
  const txns = await getAppPayTransactions(
    appAddr,
    Buffer.from(enc.encode("enter_game")).toString("base64")
  );
  return txns;
}

export async function getAppEnterGameTransactionsBetweenRounds(
  appAddr: string,
  minRound: number,
  maxRound: number
) {
  const enc = new TextEncoder();
  const txns = await getAppPayTransactionsBetweenRounds(
    appAddr,
    minRound,
    maxRound,
    Buffer.from(enc.encode("enter_game")).toString("base64")
  );
  return txns;
}

export async function getAppEnterGameTransactionsFromRound(
  appAddr: string,
  minRound: number
) {
  const enc = new TextEncoder();
  const txns = await getAppPayTransactionsFromRound(
    appAddr,
    minRound,
    Buffer.from(enc.encode("enter_game")).toString("base64")
  );
  return txns;
}

export async function getAppPayWinnerTransactions(appAddr: string) {
  const enc = new TextEncoder();

  const txns = (await getAppPayTransactions(appAddr))
    .map((txn) => txn["inner-txns"])
    .filter(
      (innerTxn) =>
        innerTxn.note ==
        Buffer.from(enc.encode("pay_winner")).toString("base64")
    );
  return txns;
}

export async function getAppPayWinnerTransactionsBetweenRounds(
  appAddr: string,
  minRound: number,
  maxRound: number
) {
  const enc = new TextEncoder();
  const txns = (
    await getAppPayTransactionsBetweenRounds(appAddr, minRound, maxRound)
  )
    .map((txn) => txn["inner-txns"])
    .filter(
      (innerTxn) =>
        innerTxn.note ==
        Buffer.from(enc.encode("pay_winner")).toString("base64")
    );
  return txns;
}

export async function getAppPayWinnerTransactionsFromRound(
  appAddr: string,
  minRound: number
) {
  const enc = new TextEncoder();
  const txns = (await getAppPayTransactionsFromRound(appAddr, minRound))
    .map((txn) => txn["inner-txns"])
    .filter(
      (innerTxn) =>
        innerTxn.note ==
        Buffer.from(enc.encode("pay_winner")).toString("base64")
    );
  return txns;
}

export async function getAppGenerateRandomNumberTransactions() {}

export async function getAppCallTransactions(appId: number) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .applicationID(appId)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .applicationID(appId)
      .nextToken(nextToken)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return txns;
}

export async function getAppCallTransactionsBetweenRounds(
  appId: number,
  minRound: number,
  maxRound: number
) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .applicationID(appId)
    .minRound(minRound)
    .maxRound(maxRound)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .applicationID(appId)
      .nextToken(nextToken)
      .minRound(minRound)
      .maxRound(maxRound)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return txns;
}

export async function getAppCallTransactionsFromRound(
  appId: number,
  minRound: number
) {
  const txns = [];
  var data = await algoIndexer
    .searchForTransactions()
    .applicationID(appId)
    .minRound(minRound)
    .do();
  var nextToken = data["next-token"];
  var txLength = data["transactions"].length;
  //@ts-ignore
  txns.push(...data["transactions"]);

  while (txLength > 0) {
    var data = await algoIndexer
      .searchForTransactions()
      .applicationID(appId)
      .nextToken(nextToken)
      .minRound(minRound)
      .do();
    nextToken = data["next-token"];
    txLength = data["transactions"].length;
    //@ts-ignore
    txns.push(...data["transactions"]);
    await sleep(0.4);
  }
  return txns;
}
