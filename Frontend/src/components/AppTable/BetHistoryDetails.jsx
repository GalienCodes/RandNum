import dayjs from "dayjs";
import millify from "millify";
import React from "react";
import { useApp } from "../../context/AppContext";
import { constrictAddr } from "../../utils/helpers";
import EmptyState from "../common/EmptyState";
import Icon from "../common/Icon";
import { Link } from "react-router-dom";

const BetHistoryDetails = ({ bet, closeHistoryTab }) => {
  const { fetching, errorHistory } = useApp();
  const { gameParams } = bet || {};

  return (
    <>
      <div className="app-modal__header">
        <h2>Details</h2>
        <button className="close-modal-btn" onClick={closeHistoryTab}>
          <Icon.Close />
        </button>
      </div>

      {fetching ? (
        <EmptyState
          fullScreen={true}
          isLoading={true}
          title={"Fetching bet details"}
        />
      ) : errorHistory ? (
        <EmptyState
          isError
          fullScreen={true}
          title={"Error fetching bet details"}
          description={errorHistory?.message}
        />
      ) : !bet ? (
        <EmptyState
          noMatch
          fullScreen={true}
          title={"No record found for this Bet Id"}
          description={errorHistory?.message}
        />
      ) : (
        <div className="bet-details">
          <ul className="bet-details__list">
            <li className="bet-details__list-item">
              <p className="key">Bet Id</p>
              <p className="value">{constrictAddr(bet?._id)}</p>
            </li>

            {Object.keys(gameParams)?.map((key, index) => {
              return (
                <li className="bet-details__list-item" key={index}>
                  <p className="key">{key?.split(/(?=[A-Z])/).join(" ")}</p>

                  {key === "gameMaster" ? (
                    <Link
                      className="value"
                      style={{
                        fontSize: "13px",
                        textDecoration: "underline",
                      }}
                      to={`/profile/${gameParams[key]}`}
                    >
                      {constrictAddr(gameParams[key])}
                    </Link>
                  ) : key !== "ticketFee" ? (
                    <p className="value">
                      {[
                        "ticketingStart",
                        "withdrawalStart",
                        "ticketingDuration",
                      ].includes(key) && !isNaN(gameParams[key])
                        ? key === "ticketingDuration"
                          ? parseInt(
                              dayjs
                                .duration(gameParams[key] * 1000)
                                ?.asMinutes()
                            ) + " mins"
                          : dayjs(gameParams[key] * 1000).format(
                              "HH:mm, MMM DD"
                            )
                        : key === "gameMaster"
                        ? constrictAddr(gameParams[key])
                        : gameParams[key] ?? "N/A"}
                    </p>
                  ) : (
                    <div className="amount">
                      <Icon.AlgoRound />
                      <p className="indicator indicator-success">
                        {millify(gameParams?.ticketFee / 1e6, {
                          precision: 1,
                        })}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}

            <li className="bet-details__list-item">
              <p className="key">Transaction Id</p>
              <a
                aria-label="transaction-id"
                target="_blank"
                rel="noreferrer"
                className="value"
                style={{
                  fontSize: "13px",
                  textDecoration: "underline",
                }}
                href={`https://testnet.algoexplorer.io/tx/${bet?.txReference}`}
              >
                {constrictAddr(bet?.txReference)}
              </a>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default BetHistoryDetails;
