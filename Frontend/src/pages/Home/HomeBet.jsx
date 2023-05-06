import dayjs from "dayjs";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/common/Icon";
import { constrictAddr } from "../../utils/helpers";

const HomeBet = ({ bet, index }) => {
  const linkRef = useRef([]);
  const navigation = useNavigate();

  return (
    <div
      className="home-page__recent-bets__card"
      onClick={e => {
        if (linkRef.current && linkRef.current.includes(e.target)) {
          return;
        }
        navigation("/history/" + bet?._id);
      }}
    >
      <div className="header">
        <div className="header__row">
          <div className="header__row__betId">
            <p>{constrictAddr(bet?._id)}</p>
          </div>
        </div>
        <div className="header__row">
          <div className="header__row__luckyNo">
            <Icon.Dawn />
            <p>Lucky No: </p>
            <p>{bet?.gameParams?.luckyNumber}</p>
          </div>
        </div>
      </div>

      <div className="details">
        <div className="details__row">
          <p>Started</p>
          <p>
            {!isNaN(bet?.gameParams?.ticketingStart) &&
              dayjs(bet?.gameParams?.ticketingStart * 1000).format(
                "HH:mm, MMM DD"
              )}
          </p>
        </div>
        <div className="details__row">
          <p>Closed</p>
          <p>
            {!isNaN(bet?.gameParams?.ticketingDuration) &&
              dayjs(
                (bet?.gameParams?.ticketingStart +
                  bet?.gameParams?.ticketingDuration) *
                  1000
              ).format("HH:mm, MMM DD")}
          </p>
        </div>
        <div className="details__row">
          <p>Txn Reference</p>
          <a
            target="_blank"
            rel="noreferrer"
            aria-label="transaction-reference"
            ref={el => (linkRef.current[index] = el)}
            href={
              bet?.txReference
                ? `https://testnet.algoexplorer.io/tx/${bet?.txReference}`
                : ""
            }
          >
            {bet?.txReference && constrictAddr(bet?.txReference)}
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomeBet;
