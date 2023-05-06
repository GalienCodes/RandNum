import { waitForConfirmation } from "algosdk";
import { appAddr, user } from "../scripts/config";
import { getGameParams, initializeGameParams } from "../scripts/lottoCall";
import { algodClient } from "../scripts/utils";
import { getCurrentGameParam } from "../server/helpers";

//make sure a new test version of the contract is deployed
describe("Lotto", () => {
  jest.setTimeout(10000);
  test("it should initialize game params", async () => {
    const ticketingStart = Math.round(Date.now() / 1000 + 200);
    const ticketingDuration = 960;
    const withdrawalStart = ticketingStart + 2000;
    const ticketFee = 2e6;
    const winMultiplier = 2;
    const maxPlayersAllowed = 2;
    const maxGuessNumber = 10000;
    const gameMasterAddr = user.addr;
    const data = await initializeGameParams(
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
    expect(data.status).toBe(true);
    const initGameTxns = data.txns?.map((txn) => txn.signTxn(user.sk));
    if (initGameTxns) {
      const { txId } = await algodClient.sendRawTransaction(initGameTxns).do();
      await waitForConfirmation(algodClient, txId, 1000);
      expect(txId).toBeInstanceOf(String);
    }
  });

  test("it should fetch game params", async () => {
    const data = await getCurrentGameParam();
    expect(data).toBeInstanceOf(Object);
  });
});
