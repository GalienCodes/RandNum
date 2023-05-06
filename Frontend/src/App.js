import Home from "./pages/Home";
import Lotto from "./pages/Lotto";
import Providers from "./providers";
import Profile from "./pages/Profile";
import History from "./pages/History";

import { useEffect } from "react";
import { PeraInst } from "./utils";
import { useRecoilState } from "recoil";
import "@szhsin/react-menu/dist/index.css";
import { addressAtom } from "./atoms/appState";
import "react-loading-skeleton/dist/skeleton.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App = () => {
  const [address, setAddress] = useRecoilState(addressAtom);

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    PeraInst.wallet
      .reconnectSession()
      .then(accounts => {
        // Setup the disconnect event listener
        PeraInst.wallet.connector?.on("disconnect", () => {
          localStorage.clear("recoil-persist");
          window.location.reload();
        });

        if (accounts.length) {
          if (!address && accounts[0]) setAddress(accounts[0]);
          // console.log("Reconnected to the session", accounts[0]);
        }
      })
      .catch(err => {
        // console.log(err);
      });
    // eslint-disable-next-line
  }, []);

  return (
    <Providers>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lotto" element={<Lotto />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:betId" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:address" element={<Profile />} />
        </Routes>
      </Router>
    </Providers>
  );
};

export default App;
