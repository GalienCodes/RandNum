import dayjs from "dayjs";
import Icon from "../common/Icon";
import copy from "copy-to-clipboard";
import { Link } from "react-router-dom";
import { isToday } from "../../helpers/date";
import { constrictAddr } from "../../utils/helpers";
import { useEffect, useRef, useState } from "react";

const TableRow = ({ betItem, openSideModal }) => {
  const { gameParams: bet, ...betDetails } = betItem;

  const duration =
    !isNaN(bet?.ticketingDuration) &&
    !isNaN(bet?.ticketingStart) &&
    !isNaN(bet?.withdrawalStart)
      ? dayjs.duration(
          (bet?.withdrawalStart -
            (bet?.ticketingStart + bet?.ticketingDuration)) *
            1000
        )
      : "N/A";

  // Copy bet Id and toggle copy state
  const [copyState, setCopyState] = useState("");
  useEffect(() => {
    if (copyState) {
      const timer = setTimeout(() => {
        setCopyState("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  const btnRef = useRef(null);
  const linkRef = useRef(null);

  return (
    <div
      key={betDetails?._id}
      onClick={e => {
        if (
          (btnRef.current && btnRef.current.contains(e.target)) ||
          (linkRef.current && linkRef.current.contains(e.target))
        ) {
          return;
        }
        openSideModal(betDetails?._id);
      }}
      className="app-table__row"
    >
      <div className="app-table__row__item betId">
        <p>{constrictAddr(betDetails?._id).toUpperCase()}</p>
        <button
          ref={btnRef}
          style={{
            marginLeft: "2px",
            padding: "8px 10px 12px",
          }}
          onClick={() => {
            copy(window.location.origin + "/history/" + betDetails?._id);
            setCopyState("Copied");
          }}
        >
          {copyState === "Copied" ? (
            <Icon.CopyFilled size={14} color="#268755" />
          ) : (
            <Icon.Copy size={13} />
          )}
        </button>
      </div>

      <div className="app-table__row__item amt">
        <p>{bet?.luckyNumber}</p>
      </div>

      <div className="app-table__row__item amt">
        {!isNaN(bet?.ticketFee / 1e6) ? (
          <>
            <Icon.AlgoRound />
            <p>{bet?.ticketFee / 1e6}</p>
          </>
        ) : (
          <p
            style={{
              marginRight: "14px",
            }}
          >
            N/A
          </p>
        )}
      </div>

      <div className="app-table__row__item walletAddr">
        <Link ref={linkRef} to={`/profile/${bet?.gameMaster}`}>
          <p>{constrictAddr(bet?.gameMaster)}</p>
        </Link>
      </div>

      <div className="app-table__row__item winners">
        <p>{bet?.winMultiplier}</p>
      </div>

      <div className="app-table__row__item date">
        <p>
          {!isNaN(bet?.withdrawalStart)
            ? dayjs(Number(bet?.withdrawalStart) * 1000).format(
                isToday(new Date(Number(bet?.withdrawalStart) * 1000))
                  ? "HH:mm"
                  : "HH:mm, MMM DD"
              )
            : "N/A"}
        </p>
      </div>

      <div className="app-table__row__item date">
        <p>
          {duration !== "N/A"
            ? parseInt(duration?.asMinutes()) + " mins"
            : "N/A"}
        </p>
      </div>
    </div>
  );
};

export default TableRow;
