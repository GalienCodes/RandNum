import {
  makeApplicationCreateTxn,
  OnApplicationComplete,
  Transaction,
} from "algosdk";
import { user } from "./config";
import {
  algodClient,
  compilePyTeal,
  compileTeal,
  submitTransaction,
} from "./utils";

async function main() {
  let txn: Transaction;
  let txId: string;

  // compile PyTeal smart contracts
  const approval = await compileTeal(compilePyTeal("contracts/lotto"));
  const clear = await compileTeal(compilePyTeal("contracts/clear_program"));

  // declare application state storage (immutable)
  let localInts = 2;
  let localBytes = 0;
  let globalInts = 13;
  let globalBytes = 1;
  // get transaction params
  const params = await algodClient.getTransactionParams().do();
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  txn = makeApplicationCreateTxn(
    user.addr,
    params,
    OnApplicationComplete.NoOpOC,
    approval,
    clear,
    localInts,
    localBytes,
    globalInts,
    globalBytes,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    3
  );
  txId = await submitTransaction(txn, user.sk);
  let transactionResponse = await algodClient
    .pendingTransactionInformation(txId)
    .do();

  const appId = transactionResponse["application-index"];
  console.log("Deposit application id: " + appId);
}

main().catch(console.error);
