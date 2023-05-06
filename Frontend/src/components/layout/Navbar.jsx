import Icon from "../common/Icon";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import ConnectedWallet from "./ConnectedWallet";
import useAppModal from "../../hooks/useAppModal";
import { addressAtom } from "../../atoms/appState";
import WalletConnectModal from "../modals/WalletConnectModal";
import { useWindowWidth } from "@react-hook/window-size/throttled";
import { useEffect } from "react";

const Navbar = () => {
  const windowWidth = useWindowWidth();
  const walletAddress = useRecoilValue(addressAtom);
  const [ConnectModal, closeConnectModal, openConnectModal] = useAppModal();

  useEffect(() => {
    if (walletAddress) {
      closeConnectModal();
    }
  }, [walletAddress, closeConnectModal]);

  return (
    <>
      <div className="app-navbar">
        <Link to={"/"} className="logo">
          <Icon.Logo2 />
        </Link>

        {walletAddress ? (
          <ConnectedWallet />
        ) : (
          <button
            className="connect-wallet-btn"
            onClick={openConnectModal}
            aria-label="connect-wallet"
            style={{
              width: windowWidth > 570 ? "auto" : "34px",
              height: windowWidth > 570 ? "auto" : "34px",
              borderRadius: windowWidth > 570 ? "8px" : "300px",
              padding: windowWidth > 570 ? "8px 15px" : "0px",
            }}
          >
            <Icon.Wallet size={windowWidth > 570 ? 13 : 14} />

            {windowWidth > 570 && <p>&nbsp; Connect Wallet</p>}
          </button>
        )}
      </div>

      <ConnectModal isCentered={true}>
        <WalletConnectModal closeConnectModal={closeConnectModal} />
      </ConnectModal>
    </>
  );
};

export default Navbar;
