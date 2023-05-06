import algosdk, { waitForConfirmation } from "algosdk";
import { ALGOD_CLIENT } from "./constants";
import MyAlgoWallet from "@randlabs/myalgo-connect";
import { PeraWalletConnect } from "@perawallet/connect";

export class Pera {
  wallet = new PeraWalletConnect();

  constructor(network) {
    this.client = ALGOD_CLIENT[network];
  }

  async disconnect() {
    try {
      await this.wallet?.disconnect();
      localStorage.clear("recoil-persist");
    } catch (error) {
      //
    }
  }

  async connect() {
    try {
      const addresses = await this.wallet.connect();
      this.wallet.connector?.on("disconnect", () => {
        localStorage.clear("recoil-persist");
        window.location.reload();
      });
      return addresses[0];
    } catch (err) {
      if (err?.data?.type !== "CONNECT_MODAL_CLOSED") {
        throw new Error("Error encountered");
      } else {
        throw new Error(err.message);
      }
    }
  }

  async signTransaction(txn) {
    const singleTxnGroups = [{ txn: txn }];
    try {
      const signedTxn = await this.wallet.signTransaction([singleTxnGroups]);
      return await this.client.sendRawTransaction(signedTxn).do();
    } catch (err) {
      throw new Error(err.message);
    }
  }
}

export class MyAlgo {
  wallet = new MyAlgoWallet();

  constructor(network) {
    this.client = ALGOD_CLIENT[network];
  }

  async connect() {
    try {
      const accounts = await this.wallet.connect({
        shouldSelectOneAccount: true,
      });
      return accounts[0].address;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async signTransaction(txn) {
    try {
      const signedTxn = await this.wallet.signTransaction(txn.toByte());
      return await this.client.sendRawTransaction(signedTxn.blob).do();
    } catch (err) {
      throw new Error(err.message);
    }
  }
}

export const PeraInst = new Pera("testnet");
export const MyAlgoInst = new MyAlgo("testnet");

export const MultiSigner = async (txns, provider) => {
  if (provider === "myAlgo") {
    const decodedTxns = txns.map(txn =>
      algosdk.decodeUnsignedTransaction(new Uint8Array(txn)).toByte()
    );

    const signedTxns = await MyAlgoInst.wallet.signTransaction(decodedTxns);

    const blobArray = signedTxns.map(item => item.blob);

    const submittedTxn = ALGOD_CLIENT["testnet"]
      .sendRawTransaction(blobArray)
      .do();

    console.log("Submitted", submittedTxn);
    await waitForConfirmation(
      ALGOD_CLIENT["testnet"],
      submittedTxn?.txId,
      1000
    );
  } else if (provider === "pera") {
    const decodedTxns = txns.map(txn => {
      return {
        txn: algosdk.decodeUnsignedTransaction(new Uint8Array(txn)),
      };
    });

    const signedTxns = await PeraInst.wallet.signTransaction([decodedTxns]);
    const submittedTxn = await ALGOD_CLIENT["testnet"]
      .sendRawTransaction(signedTxns)
      .do();

    console.log("Submitted", submittedTxn);
    await waitForConfirmation(
      ALGOD_CLIENT["testnet"],
      submittedTxn?.txId,
      1000
    );
  }
};
