import {
  encodeUint64,
  getApplicationAddress,
  makeApplicationNoOpTxn,
  makeBasicAccountTransactionSigner,
  makeApplicationOptInTxn,
  Transaction,
  ABIContract,
  AtomicTransactionComposer,
  ABIMethod,
  Account,
  OnApplicationComplete,
  makePaymentTxnWithSuggestedParamsFromObject,
  assignGroupID,
  ALGORAND_MIN_TX_FEE,
  decodeAddress,
  decodeUnsignedTransaction,
} from "algosdk";
import { appAddr, appId, randomnessBeaconContract, user } from "./config";
import { algoIndexer, checkUserOptedIn, getMethodByName } from "./utils";
// import { appId, user } from "./config";
import { algodClient, submitTransaction } from "./utils";

async function OptIn(user: Account, appId: number) {
  let txId: string;
  let txn;

  // get transaction params
  const params = await algodClient.getTransactionParams().do();

  // deposit
  //@ts-ignore
  const enc = new TextEncoder();
  const depositAmount = 1e6; // 1 ALGO

  // create and send OptIn
  txn = makeApplicationOptInTxn(user.addr, params, appId);
  txId = await submitTransaction(txn, user.sk);

  // display results
  let transactionResponse = await algodClient
    .pendingTransactionInformation(txId)
    .do();
  console.log("Opted-in to app-id:", transactionResponse["txn"]["txn"]["apid"]);
}

export async function enterCurrentGame(
  playerAddr: string,
  guessNumber: number,
  ticketFee: number | bigint
) {
  // string parameter
  const params = await algodClient.getTransactionParams().do();
  const enc = new TextEncoder();
  const ticketTXn = makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: params,
    from: playerAddr,
    to: appAddr,
    amount: ticketFee,
    note: enc.encode("enter_game"),
  });
  const abi = new ABIMethod({
    name: "enter_game",
    args: [
      {
        type: "uint64",
        name: "guess_number",
      },
      {
        type: "pay",
        name: "ticket_txn",
      },
    ],
    returns: {
      type: "void",
    },
  });
  const encodedLuckyNumber = encodeUint64(guessNumber);
  var applCallTxn = makeApplicationOptInTxn(playerAddr, params, appId, [
    abi.getSelector(),
    encodedLuckyNumber,
  ]);
  if (await checkUserOptedIn(playerAddr, appId)) {
    applCallTxn = makeApplicationNoOpTxn(playerAddr, params, appId, [
      abi.getSelector(),
      encodedLuckyNumber,
    ]);
  }
  return assignGroupID([ticketTXn, applCallTxn]);
}

export async function changeCurrentGameNumber(
  playerAddr: string,
  newGuessNumber: number
) {
  const params = await algodClient.getTransactionParams().do();

  const abi = new ABIMethod({
    name: "change_guess_number",
    args: [
      {
        type: "uint64",
        name: "new_guess_number",
      },
    ],
    returns: {
      type: "void",
    },
  });
  const encodedLuckyNumber = encodeUint64(newGuessNumber);
  const applCallTxn = makeApplicationNoOpTxn(playerAddr, params, appId, [
    abi.getSelector(),
    encodedLuckyNumber,
  ]);
  return [applCallTxn];
}

export async function call(
  user: Account,
  appId: number,
  method: string,
  methodArgs: any[],
  fee?: number,
  OnComplete?: OnApplicationComplete
) {
  const params = await algodClient.getTransactionParams().do();
  params.flatFee = true;
  params.fee = fee == undefined ? ALGORAND_MIN_TX_FEE : fee;

  const commonParams = {
    appID: appId,
    sender: user.addr,
    suggestedParams: params,
    signer: makeBasicAccountTransactionSigner(user),
  };

  let atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    method: getMethodByName(method),
    methodArgs: methodArgs,
    ...commonParams,
    onComplete: OnComplete,
  });
  const result = await atc.execute(algodClient, 1000);
  for (const idx in result.methodResults) {
    // console.log(result.methodResults[idx]);
  }
  return result;
}

// console.log(SHA256("Hello").toString(enc.Base64));
// call(user, appId, "generate_lucky_number", [110096026]).catch(console.error);
// call(user, appId, "get_latest_multiple", []).catch(console.error);

export async function getTotalGamesPlayed() {
  try {
    const data = await call(user, appId, "get_total_game_played ", []);
    if (data && data.methodResults[0].returnValue) {
      return parseInt(data.methodResults[0].returnValue.toString());
    }
  } catch (error) {
    return { staus: false };
  }
}

export async function getGameParams() {
  try {
    const data = await call(user, appId, "get_game_params", []);

    if (data && data.methodResults[0].returnValue) {
      return {
        data: data.methodResults[0].returnValue,
        txId: data.txIDs[0],
        status: true,
      };
    }
    return {
      status: false,
    };
  } catch (error) {
    return { status: false };
  }
}

export async function checkUserWinLottery(userAddr: string) {
  try {
    const data = await call(
      user,
      appId,
      "check_user_win_lottery",
      [userAddr],
      2 * ALGORAND_MIN_TX_FEE
    );

    if (data && data.methodResults.length > 0) {
      return {
        status: true,
        data: data.methodResults[0].returnValue,
      };
    }
  } catch (error: any) {
    console.log(error.message);
    return { status: false };
  }
}

export async function getUserGuessNumber(userAddr: string) {
  try {
    const data = await call(user, appId, "get_user_guess_number", [userAddr]);
    if (data && data.methodResults[0].returnValue) {
      return {
        data: data.methodResults[0].returnValue.toString(),
      };
    }
  } catch (error) {
    console.log(error);
    return { status: false };
  }
}

export async function generateRandomNumber() {
  try {
    await call(
      user,
      appId,
      "generate_lucky_number",
      [randomnessBeaconContract],
      2 * ALGORAND_MIN_TX_FEE
    );
    return { status: true };
  } catch (error) {
    console.log(error);
    return { status: false };
  }
}

export async function getGeneratedLuckyNumber() {
  try {
    const data = await call(user, appId, "get_lucky_number", []);
    if (data && data.methodResults[0].returnValue) {
      return {
        data: data.methodResults[0].returnValue.toString(),
      };
    }
  } catch (error) {
    return { status: false };
  }
}

export async function getMinAmountToStartGame(
  ticketFee: number,
  win_multiplier: number,
  max_players_allowed: number | bigint
) {
  const appAccountInfo = await algodClient.accountInformation(appAddr).do();
  const appSpendableBalance =
    appAccountInfo.amount - appAccountInfo["min-balance"];

  return (
    (BigInt(win_multiplier) - BigInt(1)) *
      BigInt(max_players_allowed) *
      BigInt(ticketFee) -
    BigInt(appSpendableBalance)
  );
}

export async function initializeGameParams(
  gameMasterAddr: string,
  ticketingStart: number | bigint,
  ticketingDuration: number,
  ticketFee: number,
  win_multiplier: number,
  max_guess_number: number | bigint,
  max_players_allowed: number | bigint,
  lotteryContractAddr: string,
  withdrawalStart: number | bigint
) {
  try {
    const params = await algodClient.getTransactionParams().do();
    const minAmountToTransfer = await getMinAmountToStartGame(
      ticketFee,
      win_multiplier,
      max_players_allowed
    );
    const enc = new TextEncoder();
    const newGameTxn = makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: params,
      from: gameMasterAddr,
      to: appAddr,
      amount: minAmountToTransfer <= BigInt(1e6) ? 1e6 : minAmountToTransfer,
      note: enc.encode("init_game"), //for decoding when trying to do profile(exclude init game txns)
    });
    const abi = new ABIMethod({
      name: "initiliaze_game_params",
      args: [
        {
          type: "uint64",
          name: "ticketing_start",
        },
        {
          type: "uint64",
          name: "ticketing_duration",
        },
        {
          type: "uint64",
          name: "ticket_fee",
        },
        {
          type: "uint64",
          name: "withdrawal_start",
        },
        {
          type: "uint64",
          name: "win_multiplier",
        },
        {
          type: "uint64",
          name: "max_guess_number",
        },
        {
          type: "uint64",
          name: "max_players_allowed",
        },
        {
          type: "account",
          name: "lottery_account",
        },
        {
          type: "pay",
          name: "create_txn",
        },
      ],
      returns: {
        type: "void",
      },
    });
    var applCallTxn = makeApplicationNoOpTxn(
      gameMasterAddr,
      params,
      appId,
      [
        abi.getSelector(),
        encodeUint64(ticketingStart),
        encodeUint64(ticketingDuration),
        encodeUint64(ticketFee),
        encodeUint64(withdrawalStart),
        encodeUint64(win_multiplier),
        encodeUint64(max_guess_number),
        encodeUint64(max_players_allowed),
        encodeUint64(1).subarray(7, 8),
      ],
      [lotteryContractAddr]
    );
    return {
      status: true,
      txns: assignGroupID([newGameTxn, applCallTxn]),
    };
  } catch (error) {
    console.log(error);
    return { status: false };
  }
}

export async function resetGameParams(
  lotteryContractAddr: string,
  gameMasterAddr: string,
  protocolAddr: string
) {
  try {
    const data = await call(
      user,
      appId,
      "reset_game_params",
      [lotteryContractAddr, gameMasterAddr, protocolAddr],
      3 * ALGORAND_MIN_TX_FEE
    );
    return {
      status: true,
      confirmedRound: data.confirmedRound,
    };
  } catch (error) {
    console.log(error);
    return { status: false };
  }
}
