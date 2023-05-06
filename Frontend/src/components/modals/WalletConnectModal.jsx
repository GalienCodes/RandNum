import { useState } from "react";
import Icon from "../common/Icon";
import { useSetRecoilState } from "recoil";
import { Question } from "phosphor-react";
import { MyAlgoInst, PeraInst } from "../../utils";
import { addressAtom, providerAtom } from "../../atoms/appState";
import { Tooltip } from "react-tooltip";

const WalletConnectModal = ({ closeConnectModal }) => {
  const [option, setOption] = useState("");
  const setWalletAddress = useSetRecoilState(addressAtom);
  const setWalletProvider = useSetRecoilState(providerAtom);

  const connectWallet = async provider => {
    let wallet;
    if (provider === "myAlgo") {
      wallet = MyAlgoInst;
    } else if (provider === "pera") {
      wallet = PeraInst;
    }

    try {
      const addr = await wallet.connect();
      setWalletAddress(addr);
      setWalletProvider(provider);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="app-modal__header">
        <h2>Connect wallet</h2>
        <button className="close-modal-btn" onClick={closeConnectModal}>
          <Icon.Close />
        </button>
      </div>

      <div className="app-modal__description">
        <p>Select a platform to continue</p>
      </div>

      <div className="connect-wallet-options">
        {[
          { type: "pera", name: "Pera wallet" },
          { type: "myAlgo", name: "My Algo wallet", disabled: true },
        ].map((opt, index) => {
          return (
            <div
              key={index}
              className={`connect-wallet-option ${
                opt.disabled ? "connect-wallet-option--disabled" : ""
              }`}
              onClick={() => {
                if (!opt.disabled) setOption(opt.type);
              }}
            >
              <div className="connect-wallet-option__details">
                {Icon[opt.type]()}
                <p>{opt.name}</p>
              </div>
              {!opt?.disabled ? (
                <div className="connect-wallet-option__radio">
                  {opt.type === option ? <Icon.Checked /> : null}
                </div>
              ) : (
                <>
                  <div className="connect-wallet-option__unavailable">
                    <p>Unavailable</p>
                    <Question size={19.6} color="#bbb" weight="fill" />
                  </div>

                  <Tooltip
                    className="tooltip-elem"
                    anchorSelect=".connect-wallet-option__unavailable"
                  >
                    <div className="tooltip">
                      <p>
                        My Ago wallet was hacked recently
                        <br />
                        and it is currently unsafe to use
                      </p>
                    </div>
                  </Tooltip>
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="connect-wallet-btn"
        onClick={() => {
          if (!!option) connectWallet(option);
        }}
      >
        Continue
      </button>
    </>
  );
};

export default WalletConnectModal;
