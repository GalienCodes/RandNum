import dayjs from "dayjs";
import millify from "millify";
import React from "react";
import { constrictAddr } from "../../utils/helpers";
import Icon from "../common/Icon";

const ProfileBetDetails = ({ details, closeDetailsTab }) => {
  const { lottoParams, userInteractions } = details || {};

  return (
    <>
      <div className="app-modal__header">
        <h2>Details</h2>
        <button className="close-modal-btn" onClick={closeDetailsTab}>
          <Icon.Close />
        </button>
      </div>

      <div className="bet-details">
        <ul className="bet-details__list">
          {Object.keys(lottoParams)?.map(
            (key, ind) =>
              key !== "value" && (
                <li className="bet-details__list-item" key={ind}>
                  <p className="key">{key}</p>

                  {key === "gameMaster" ? (
                    <a
                      aria-label="game-master"
                      target="_blank"
                      rel="noreferrer"
                      className="value"
                      style={{
                        fontSize: "13px",
                        textDecoration: "underline",
                      }}
                      href={`${window.location.origin}/profile/${lottoParams?.gameMaster}`}
                    >
                      {constrictAddr(lottoParams[key])}
                    </a>
                  ) : key !== "ticketFee" ? (
                    <p className="value">
                      {[
                        "ticketingStart",
                        "withdrawalStart",
                        "ticketingDuration",
                      ].includes(key) && !isNaN(lottoParams[key])
                        ? key === "ticketingDuration"
                          ? parseInt(
                              dayjs
                                .duration(lottoParams[key] * 1000)
                                ?.asMinutes()
                            ) + " mins"
                          : dayjs(lottoParams[key] * 1000).format(
                              "HH:mm, MMM DD"
                            )
                        : key === "gameMaster"
                        ? constrictAddr(lottoParams[key])
                        : lottoParams[key] ?? "N/A"}
                    </p>
                  ) : (
                    <div className="amount">
                      <Icon.AlgoRound />
                      <p className="indicator indicator-success">
                        {millify(lottoParams?.ticketFee / 1e6, {
                          precision: 1,
                        })}
                      </p>
                    </div>
                  )}
                </li>
              )
          )}
        </ul>

        {userInteractions && (
          <>
            <div className="section-header">
              <h2>Activities</h2>
            </div>

            <div className="bet-activities">
              <div className="bet-activities-group">
                <div className="bet-activities-group__header">
                  Actions performed on the currently selected bet
                </div>
                <ul className="bet-activities-group__list">
                  {userInteractions?.map((action, _i) => {
                    return (
                      <li key={_i} className="bet-activities-group__list-item">
                        <div className="block ">
                          <div className="block-icon">
                            {Icon[
                              action?.action === "change_guess_number"
                                ? "ArrowsLR"
                                : "SoftStar"
                            ]()}
                          </div>
                          <div className="block-content">
                            <p style={{ textTransform: "capitalize" }}>
                              {action?.action &&
                                action?.action?.replaceAll("_", " ")}
                            </p>
                            <a
                              aria-label="transaction-id"
                              target="_blank"
                              rel="noreferrer"
                              href={
                                action?.txId
                                  ? `https://testnet.algoexplorer.io/tx/${action?.txId}`
                                  : ""
                              }
                              className="key"
                              style={{
                                fontSize: "13px",
                                textDecoration: "underline",
                              }}
                            >
                              {constrictAddr(action?.txId)}
                            </a>
                          </div>
                        </div>

                        <div className="block ">
                          {!isNaN(action?.round) && (
                            <div className="block-content values">
                              <p className="key">Round No</p>
                              {Icon["ArrowLeft"]()}
                              <p className="key">{action?.round}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProfileBetDetails;
