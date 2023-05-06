import Icon from "../common/Icon";
import { useRecoilState } from "recoil";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MyAlgoInst, PeraInst } from "../../utils";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { constrictAddr, randAvatar } from "../../utils/helpers";
import { addressAtom, providerAtom } from "../../atoms/appState";

const ConnectedWallet = () => {
  const [walletAddress, setWalletAddress] = useRecoilState(addressAtom);
  const [walletProvider, setWalletProvider] = useRecoilState(providerAtom);

  const [imgIndex, setImgIndex] = useState(null);

  const onDisconnect = () => {
    if (walletProvider === "myAlgo") {
      MyAlgoInst?.disconnect();
    } else if (walletProvider === "pera") {
      PeraInst?.disconnect();
    }

    setWalletAddress();
    setWalletProvider();
  };

  useEffect(() => {
    if (walletAddress) {
      const addrNums = walletAddress.match(/[0-9]+/)[0];
      if (addrNums) {
        setImgIndex(parseInt(addrNums[0]) % 2);
      } else {
        setImgIndex(Math.floor(Math.random() * 2));
      }
    } else {
      setImgIndex(Math.floor(Math.random() * 2));
    }
  }, [walletAddress]);

  return (
    <>
      <div className="connected-wallet">
        <Link to={`/profile/${walletAddress}`} className="wallet-preview">
          <div className="img-cover">
            {imgIndex !== null && <img src={randAvatar(imgIndex)} alt="" />}
          </div>
          <p className="address">{constrictAddr(walletAddress, 4, 4) || ""}</p>
        </Link>

        <Menu
          align="end"
          transition
          menuButton={
            <button className="options-btn" aria-label="disconnect-menu-btn">
              <Icon.CaretDown />
            </button>
          }
          menuClassName="app-menu wallet"
        >
          <MenuItem
            data-active={!!1}
            className="menu-item"
            onClick={onDisconnect}
          >
            <p>Disconnect</p>
          </MenuItem>
        </Menu>
      </div>
    </>
  );
};

export default ConnectedWallet;
