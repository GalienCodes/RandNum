import {
  decodeAddress,
  decodeUint64,
  encodeAddress,
  waitForConfirmation,
} from "algosdk";
import { appAddr, appId, initRedis, user } from "../scripts/config";
import { LottoGameArgsDecoder } from "../scripts/decode";
import {
  changeCurrentGameNumber,
  checkUserWinLottery,
  generateRandomNumber,
  getGameParams,
  getGeneratedLuckyNumber,
  getUserGuessNumber,
  initializeGameParams,
  resetGameParams,
} from "../scripts/lottoCall";
import {
  algodClient,
  getAppCallTransactionsBetweenRounds,
  getAppCallTransactionsFromRound,
  getAppEnterGameTransactions,
  getAppEnterGameTransactionsBetweenRounds,
  getAppEnterGameTransactionsFromRound,
  getAppPayTransactions,
  getAppPayTransactionsBetweenRounds,
  getAppPayTransactionsFromRound,
  getAppPayWinnerTransactions,
  getAppPayWinnerTransactionsBetweenRounds,
  getTransactionReference,
  getUserTransactionstoApp,
  getUserTransactionstoAppBetweenRounds,
  sleep,
} from "../scripts/utils";
import { GameParams, LottoModel } from "./models/lottoHistory";

interface UserBetDetailValue {
  userInteractions: {
    userAddr: string;
    action: string | null;
    value: any;
    round: number;
    txId: string;
  }[];
  lottoParams?: GameParams;
  id?: string;
}

interface UserBetDetail {
  [key: string]: UserBetDetailValue;
}

interface Transaction {
  sender: string;
  id: string;
  group?: string;
  "confirmed-round": number;
  "application-transaction": {
    "application-args": string[];
    accounts: string[];
  };
  "payment-transaction": {
    receiver: string;
  };
}

function parseLottoTxn(userTxns: Transaction[]) {
  const decoder = new LottoGameArgsDecoder();
  const filteredAndParsed = userTxns
    .filter((userTxn) =>
      decoder.encodedMethods.includes(
        userTxn["application-transaction"]["application-args"][0]
      )
    )
    .map((userTxn) => {
      const action = decoder.decodeMethod(
        userTxn["application-transaction"]["application-args"][0]
      );
      var value;
      if (action == "check_user_win_lottery") {
        value =
          userTxn["application-transaction"]["accounts"][0] ||
          userTxn["sender"];
      } else if (action == "initiliaze_game_params") {
        const initParams = userTxn["application-transaction"][
          "application-args"
        ]
          .slice(1, 8)
          .map((arg) => decodeUint64(Buffer.from(arg, "base64"), "mixed"));
        value = {
          ticketingStart: initParams[0],
          ticketingDuration: initParams[1],
          ticketFee: initParams[2],
          withdrawalStart: initParams[3],
          win_multiplier: initParams[4],
          max_guess_number: initParams[5],
          max_players_allowed: initParams[6],
        };
      } else if (action == "change_guess_number" || action == "enter_game") {
        value = decodeUint64(
          Buffer.from(
            userTxn["application-transaction"]["application-args"][1],
            "base64"
          ),
          "mixed"
        );
      }
      return {
        userAddr: userTxn["sender"],
        action: action,
        value: value,
        txId: userTxn["id"],
        round: userTxn["confirmed-round"],
      };
    });

  return filteredAndParsed;
}

export async function getUserLottoHistory(
  userAddr: string
): Promise<UserBetDetail> {
  try {
    const userTxns: Transaction[] = await getUserTransactionstoApp(
      userAddr,
      appId
    );
    const userInteractions = parseLottoTxn(userTxns).filter(
      (parsedTxns) => parsedTxns.value != undefined
    );

    const data: Record<string, UserBetDetailValue> = {};
    const filtered = await Promise.all(
      userInteractions.map(async (userInteraction) => {
        const lottoDetails = await LottoModel.findOne({
          roundEnd: { $gte: userInteraction.round },
          roundStart: { $lte: userInteraction.round },
        });

        const lottoId = lottoDetails?.lottoId || -1;
        const lottoParams = lottoDetails?.gameParams;
        if (!data[String(lottoId)]) {
          data[String(lottoId)] = {
            userInteractions: [userInteraction],
            lottoParams: lottoParams,
            id: lottoDetails?.id,
          };
        } else {
          data[String(lottoId)]["userInteractions"].push(userInteraction);
        }
      })
    );

    return data;
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function getUserHistoryByLottoId(
  lottoId: number,
  userAddr: string
): Promise<UserBetDetail> {
  try {
    const betHistoryDetails = await LottoModel.findOne({ lottoId: lottoId });
    var lottoMinRound;
    var lottoMaxRound;
    var userTxns: Transaction[];
    if (betHistoryDetails) {
      lottoMinRound = betHistoryDetails.roundStart;
      lottoMaxRound = betHistoryDetails.roundEnd;
      userTxns = await getUserTransactionstoAppBetweenRounds(
        userAddr,
        appId,
        lottoMinRound,
        lottoMaxRound
      );
    } else {
      return {};
    }
    const userInteractions = parseLottoTxn(userTxns).filter(
      (parsedTxns) => parsedTxns.value != undefined
    );
    return {
      [String(lottoId)]: {
        userInteractions: userInteractions,
        lottoParams: betHistoryDetails?.gameParams,
        id: betHistoryDetails?.id,
      },
    };
  } catch (error) {
    console.log(error);
    return {};
  }
}

export async function getLottoCallsById(lottoId: number) {
  try {
    const betHistoryDetails = await LottoModel.findOne({ lottoId: lottoId });
    if (betHistoryDetails) {
      const lottoMinRound = betHistoryDetails.roundStart;
      const lottoMaxRound = betHistoryDetails.roundEnd;
      const lottoTxns = await getAppCallTransactionsBetweenRounds(
        appId,
        lottoMinRound,
        lottoMaxRound
      );

      const lottoInteractions = parseLottoTxn(lottoTxns).filter(
        (parsedTxns) => parsedTxns.value
      );

      return {
        [String(lottoId)]: {
          userInteractions: lottoInteractions.filter(
            (interaction) =>
              interaction.action == "initiliaze_game_params" ||
              interaction.action == "generate_lucky_number"
          ),
          lottoParams: betHistoryDetails?.gameParams,
        },
      };
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

export async function getLottoPayTxnById(lottoId: number) {
  try {
    const betHistoryDetails = await LottoModel.findOne({ lottoId: lottoId });
    if (betHistoryDetails) {
      const lottoMinRound = betHistoryDetails.roundStart;
      const lottoMaxRound = betHistoryDetails.roundEnd;

      const receivedTxns = await getAppEnterGameTransactionsBetweenRounds(
        appAddr,
        lottoMinRound,
        lottoMaxRound
      );
      const sentTxns = await getAppPayWinnerTransactionsBetweenRounds(
        appAddr,
        lottoMinRound,
        lottoMaxRound
      );
      return { receivedTxns: receivedTxns, sentTxns: sentTxns };
    } else {
      return { receivedTxns: [], sentTxns: [] };
    }
  } catch (error) {
    console.log(error);
    return { receivedTxns: [], sentTxns: [] };
  }
}

export async function getLottoPayTxn() {
  try {
    const receivedTxns = await getAppEnterGameTransactions(appAddr);
    const sentTxns = await getAppPayWinnerTransactions(appAddr);
    return { receivedTxns: receivedTxns, sentTxns: sentTxns };
  } catch (error) {
    console.log(error);
    return { receivedTxns: [], sentTxns: [] };
  }
}

export async function getPlayerCurrentGuessNumber(userAddr: string) {
  const result = await getUserGuessNumber(userAddr);
  return result;
}

export async function getPlayerChangeGuessNumber(
  userAddr: string,
  newGuessNumber: number
) {
  const result = await changeCurrentGameNumber(userAddr, newGuessNumber);
  return result;
}

export async function getCurrentGeneratedNumber() {
  const result = await getGeneratedLuckyNumber();
  return result;
}

export async function generateLuckyNumber() {
  const gameParams = await getCurrentGameParam();

  //only when there is a current game being played and we are in the random number generation stage
  if (
    gameParams.ticketingStart != 0 &&
    gameParams.luckyNumber == 0 &&
    gameParams.ticketingStart + gameParams.ticketingDuration <
      Math.round(Date.now() / 1000)
  ) {
    const result = await generateRandomNumber();
    return result;
  } else {
    console.log("Can not generate random number in this phase of game");
    return { status: false };
  }
}

export async function getCurrentGameParam() {
  const data = await getGameParams();
  const gameParams: GameParams = {
    ticketingStart: 0,
    ticketingDuration: 0,
    withdrawalStart: 0,
    ticketFee: 0,
    luckyNumber: 0,
    playersTicketBought: 0,
    winMultiplier: 0,
    maxGuessNumber: 0,
    maxPlayersAllowed: 0,
    gameMaster: "",
    playersTicketChecked: 0,
    totalGamePlayed: 0,
  };
  const gameParamsKey = [
    "ticketingStart",
    "ticketingDuration",
    "withdrawalStart",
    "ticketFee",
    "luckyNumber",
    "playersTicketBought",
    "winMultiplier",
    "maxGuessNumber",
    "maxPlayersAllowed",
    "gameMaster",
    "playersTicketChecked",
    "totalGamePlayed",
  ];
  gameParamsKey.forEach(
    //@ts-ignore
    (gameParamKey, i) =>
      //@ts-ignore
      (gameParams[gameParamKey] = Number.isNaN(Number(data.data[i]))
        ? //@ts-ignore
          String(data.data[i])
        : //@ts-ignore
          Number(data.data[i]))
  );
  return gameParams;
}

export async function getGameParamsById(lottoId: number) {
  const betHistoryDetails = await LottoModel.findOne({ lottoId: lottoId });
  return betHistoryDetails;
}

export async function decodeTxReference(txId: string) {
  const data = await getTransactionReference(txId);
  return data;
}

export async function checkPlayerWinStatus(playerAddr: string) {
  const data = await checkUserWinLottery(playerAddr);
  return data;
}

export async function endCurrentAndCreateNewGame(
  ticketingStart = Math.round(Date.now() / 1000 + 200),
  ticketingDuration = 3600,
  withdrawalStart = ticketingStart + 4600,
  ticketFee = 2e6,
  winMultiplier = 2,
  maxPlayersAllowed = 20,
  maxGuessNumber = 100000,
  gameMasterAddr = user.addr
) {
  const data = await getGameParams();
  if (!data?.status || !data.data) {
    return { newLottoDetails: {}, newGame: { status: false, txns: [] } };
  }

  //@ts-ignore
  const gameParams: GameParams = {};
  const gameParamsKey = [
    "ticketingStart",
    "ticketingDuration",
    "withdrawalStart",
    "ticketFee",
    "luckyNumber",
    "playersTicketBought",
    "winMultiplier",
    "maxGuessNumber",
    "maxPlayersAllowed",
    "gameMaster",
    "playersTicketChecked",
    "totalGamePlayed",
  ];
  gameParamsKey.forEach(
    (gameParamKey, i) =>
      //@ts-ignore
      (gameParams[gameParamKey] = Number.isNaN(Number(data.data[i]))
        ? //@ts-ignore
          String(data.data[i])
        : //@ts-ignore
          Number(data.data[i]))
  );

  const lottoId = Number(gameParams.totalGamePlayed);

  // Only reset game when there has been a game played(just initialize game)
  if (gameParams.ticketingStart == 0) {
    console.log("No new game was played on contract");
    const success = await initializeGameParams(
      gameMasterAddr,
      BigInt(ticketingStart),
      ticketingDuration,
      ticketFee,
      winMultiplier,
      maxGuessNumber,
      maxPlayersAllowed,
      appAddr,
      BigInt(withdrawalStart)
    );
    return { newLottoDetails: {}, newGame: success };
  }

  //if game is not yet over do not restart
  if (
    gameParams.withdrawalStart > Math.round(Date.now() / 1000) ||
    gameParams.playersTicketBought != gameParams.playersTicketChecked
  ) {
    console.log("Current Game not finished");
    return { newLottoDetails: {}, newGame: { status: false, txns: [] } };
  }

  const resetStatus = await resetGameParams(
    appAddr,
    gameParams.gameMaster,
    user.addr
  );
  if (!resetStatus.status || !resetStatus.confirmedRound) {
    return { newLottoDetails: {}, newGame: { status: false, txns: [] } };
  }

  const betHistoryDetails = await LottoModel.findOne({ lottoId: lottoId });
  const prevbetHistoryDetails = await LottoModel.findOne({
    lottoId: lottoId - 1,
  });
  if (!betHistoryDetails) {
    await LottoModel.create({
      lottoId: lottoId,
      roundStart: prevbetHistoryDetails?.roundEnd || 0,
      roundEnd: resetStatus.confirmedRound,
      gameParams: gameParams,
      txReference: data.txId,
    });
  } else {
    betHistoryDetails.gameParams = gameParams;
    betHistoryDetails.roundEnd = resetStatus.confirmedRound;
    betHistoryDetails.txReference = data.txId;
    await betHistoryDetails.save();
  }
  var newLotto = await LottoModel.findOne({ lottoId: lottoId + 1 });
  if (!newLotto) {
    newLotto = await LottoModel.create({
      lottoId: lottoId + 1,
      roundStart: resetStatus.confirmedRound,
    });
  }
  const success = await initializeGameParams(
    gameMasterAddr,
    BigInt(ticketingStart),
    ticketingDuration,
    ticketFee,
    winMultiplier,
    maxGuessNumber,
    maxPlayersAllowed,
    appAddr,
    BigInt(withdrawalStart)
  );

  return { newLottoDetails: newLotto, newGame: success };
}

export async function checkAllPlayersWin() {
  try {
    const gameParams = await getCurrentGameParam();
    const lottoId = gameParams.totalGamePlayed;
    if (
      gameParams.withdrawalStart != 0 &&
      gameParams.withdrawalStart < Math.round(Date.now() / 1000)
    ) {
      console.log("Checking win status");
      const lotto = await LottoModel.findOne({ lottoId: lottoId });
      const minRound = lotto?.roundStart || 0;
      const playerPayTxns: Transaction[] =
        await getAppEnterGameTransactionsFromRound(appAddr, minRound);

      const potentialPlayers = playerPayTxns.map((txn) => txn.sender);

      const playerCallTxns = await getAppCallTransactionsFromRound(
        appId,
        minRound
      );
      const checkedAddresses = parseLottoTxn(playerCallTxns)
        .filter((parsedTxns) => parsedTxns.action == "check_user_win_lottery")
        .map((parsedTxn) => parsedTxn.value);
      var uncheckedAddresses = potentialPlayers.filter(
        (player) => !checkedAddresses.includes(player)
      );

      uncheckedAddresses = [...new Set(uncheckedAddresses)];
      const chunkSize = 25;
      for (let i = 0; i < uncheckedAddresses.length; i += chunkSize) {
        const chunk = uncheckedAddresses.slice(i, i + chunkSize);
        await Promise.all(chunk.map((player) => checkUserWinLottery(player)));
        console.log(
          `Checked win status for ${i} out of ${uncheckedAddresses.length}`
        );
      }
      return { status: true };
    } else {
      console.log("Not in withdrawal phase.");
      return { status: false };
    }
  } catch (error: any) {
    console.error(error.message);
    return { status: false };
  }
}
