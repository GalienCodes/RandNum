import { isValidAddress } from "algosdk";
import axios from "axios";
import avatars from "../assets/avatars";
import { ALGOD_CLIENT } from "./constants";

const randAvatar = index => avatars[index];

const constrictAddr = (address, start = 5, end = 5) => {
  if (address && typeof address === "string") {
    return (
      address.substring(0, start) +
      "..." +
      address.substring(address.length - end, address.length)
    );
  }
};

export async function getMinAmountToStartGame(
  ticketFee,
  win_multiplier,
  max_players_allowed
) {
  const appAddr = "ROJM7BEKK7X6HVMQONMFFXB4PLOSAKLFFC5SGU4EQJIPUC5A4XB3YIMF7I";
  const appAccountInfo = await ALGOD_CLIENT["testnet"]
    .accountInformation(appAddr)
    .do();
  const appSpendableBalance =
    appAccountInfo.amount - appAccountInfo["min-balance"];

  const minAmountToStartGame =
    (win_multiplier - 1) * max_players_allowed * ticketFee -
    appSpendableBalance;

  return minAmountToStartGame < 1e6 ? 1 : minAmountToStartGame / 1e6;
}

const getBalance = async address => {
  if (!isValidAddress(address)) return 0;

  try {
    const balance = await axios
      .get(`https://node.testnet.algoexplorerapi.io/v2/accounts/${address}`)
      .then(res => res?.data?.amount / 1e6);

    return balance;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

export { randAvatar, getBalance, constrictAddr };
