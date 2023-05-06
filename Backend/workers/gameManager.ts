import Queue from "bull";
import { CronJob } from "cron";
import {
  checkAllPlayersWin,
  endCurrentAndCreateNewGame,
  generateLuckyNumber,
  getCurrentGameParam,
} from "../server/helpers";
import {
  MODE,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  initRedis,
  user,
} from "../scripts/config";
import { algodClient, cache } from "../scripts/utils";
import { waitForConfirmation } from "algosdk";
import { GameParams, LottoModel } from "../server/models/lottoHistory";
import { client } from "../server/app";

var newGameQueue: Queue.Queue;
var generateNumberQueue: Queue.Queue;
var checkUserWinQueue: Queue.Queue;

//The least time a game lasts for is 30 mins
if (MODE == "PRODUCTION") {
  newGameQueue = new Queue("newGame", {
    redis: {
      port: REDIS_PORT,
      host: REDIS_HOST,
      password: REDIS_PASSWORD,
    },
  });
  generateNumberQueue = new Queue("generateNumber", {
    redis: {
      port: REDIS_PORT,
      host: REDIS_HOST,
      password: REDIS_PASSWORD,
    },
  });
  checkUserWinQueue = new Queue("checkUserWin", {
    redis: {
      port: REDIS_PORT,
      host: REDIS_HOST,
      password: REDIS_PASSWORD,
    },
  });
} else {
  newGameQueue = new Queue("newGame", "redis://127.0.0.1:6379");
  generateNumberQueue = new Queue("generateNumber", "redis://127.0.0.1:6379");
  checkUserWinQueue = new Queue("checkUserWin", "redis://127.0.0.1:6379");
}

newGameQueue.process(async function (job, done) {
  try {
    const data = await endCurrentAndCreateNewGame();
    console.log(
      `New Game status:${data.newGame.status}. New Game Txn Length:${data.newGame.txns?.length}`
    );
    if (data.newGame.status) {
      const initGameTxns = data.newGame.txns;
      if (initGameTxns && initGameTxns.length > 0) {
        try {
          const signed = initGameTxns.map((txn) => txn.signTxn(user.sk));
          const { txId } = await algodClient.sendRawTransaction(signed).do();
          await waitForConfirmation(algodClient, txId, 1000);
          console.log("Created new Game");
        } catch (error: any) {
          console.log(error.message);
          console.error("Could not create a new game because txn failed");
        }
      }
      const key = "Current Game Parameter";
      await cache<GameParams>(key, [], 2, getCurrentGameParam, client);
    }
    done();
  } catch (error: any) {
    console.error(
      "Resetting game failed.Check if current game is still running"
    );
    done(error);
  }
});

generateNumberQueue.process(async function (job, done) {
  try {
    const success = await generateLuckyNumber();
    console.log(`generate number status ${success?.status}`);
    done();
  } catch (error: any) {
    console.error("Error generating number");
    done(error);
  }
});

checkUserWinQueue.process(async function (job, done) {
  try {
    const success = await checkAllPlayersWin();
    console.log(`check user win status ${success.status}`);
    done();
  } catch (error: any) {
    console.error("Error checking user win");
    done(error);
  }
});

export var restartGame = new CronJob(
  "*/60 * * * *",
  function () {
    console.log("Starting to restart game");
    newGameQueue.add(
      {},
      {
        attempts: 3,
        backoff: 3000,
      }
    );
  },
  null,
  true
);

export var generateNumber = new CronJob(
  "*/15 * * * *",
  function () {
    console.log("Starting to generate number");
    generateNumberQueue.add(
      {},
      {
        attempts: 3,
        backoff: 3000,
      }
    );
  },
  null,
  true
);

export var checkUserWin = new CronJob(
  "*/15 * * * *",
  function () {
    console.log("Starting to check users");
    checkUserWinQueue.add(
      {},
      {
        attempts: 3,
        backoff: 3000,
      }
    );
  },
  null,
  true
);
