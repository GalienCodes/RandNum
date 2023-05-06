import dayjs from "dayjs";
import Icon from "../../components/common/Icon";

const LottoDetails = ({ data, phase, withdrawalStart }) => {
  const dateProperties = ["ticketingStart", "withdrawalStart"];

  return (
    <>
      <div className="lotto-page__details">
        <ul className="bet-details__list no-margin">
          {Object.keys(data)
            .filter(
              key => key !== "ticketingStart" && key !== "ticketingDuration"
            )
            ?.map((key, ind) => (
              <li className="bet-details__list-item" key={ind}>
                <p className="key">
                  {key === "maxPlayersAllowed"
                    ? "Max Players"
                    : key === "playersTicketBought"
                    ? "Tickets Bought"
                    : key === "playersTicketChecked"
                    ? "Tickets Checked"
                    : key?.split(/(?=[A-Z])/).join(" ")}
                </p>

                {key === "ticketFee" ? (
                  <div className="amount-value">
                    <Icon.AlgoRound />
                    <p className="value">{data[key] / 1e6}</p>
                  </div>
                ) : key === "ticketingDuration" ? (
                  <p className="value">{data[key] / 60 + " min"}</p>
                ) : dateProperties.includes(key) ? (
                  <p className="value">
                    {dayjs(Number(data[key]) * 1000).format("HH:mm, MMM DD")}
                  </p>
                ) : key !== "current-phase" ? (
                  <p className="value">{data[key]}</p>
                ) : (
                  <div className="amount-value">
                    <p
                      className={`indicator indicator-${
                        phase === "ticketing"
                          ? "pending"
                          : phase === "live"
                          ? "success"
                          : "inactive"
                      }`}
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {phase}
                    </p>
                  </div>
                )}
              </li>
            ))}

          {!isNaN(data?.ticketingStart) && !isNaN(data?.ticketingDuration) && (
            <li className="bet-details__list-item">
              <p className="key">Ticketing Ends</p>

              <p className="value">
                {dayjs(
                  Number(data?.ticketingStart + data?.ticketingDuration) * 1000
                ).format("HH:mm, MMM DD")}
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
};

export default LottoDetails;
