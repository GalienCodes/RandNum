import "./index.scss";
import _ from "lodash";
import dayjs from "dayjs";
import axios from "axios";
import { useInterval } from "react-use";
import LottoDetails from "./LottoDetails";
import { useEffect, useState } from "react";
import LottoUserActions from "./LottoUserActions";
import Navbar from "../../components/layout/Navbar";
import EmptyState from "../../components/common/EmptyState";

const Lotto = () => {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [phase, setPhase] = useState("ticketing");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentGame = async message => {
    if (data === undefined) setIsLoading(true);
    setError(undefined);

    if (message) console.log(message);

    try {
      const newData = await axios
        .get(`/currentGameParams`)
        .then(response => response?.data?.data);

      console.log(message, newData);

      if (!!newData) {
        setError(undefined);
        if (!_.isEqual(data, newData)) {
          setData(newData);
        }
      }
    } catch (error) {
      if (data === undefined || !data) {
        setError(error);
      }
    } finally {
      if (isLoading) setIsLoading(false);
    }
  };

  useInterval(() => {
    fetchCurrentGame();
  }, 15000);

  useEffect(() => {
    const isTicketing = dayjs(Date.now()).isBetween(
      data?.ticketingStart * 1000,
      (data?.ticketingStart + data?.ticketingDuration) * 1000,
      "milliseconds",
      "[)"
    );

    const isLive = dayjs(Date.now()).isBetween(
      (data?.ticketingStart + data?.ticketingDuration) * 1000,
      data?.withdrawalStart * 1000,
      "milliseconds",
      "[)"
    );

    if (isTicketing) {
      setPhase("ticketing");
    } else if (isLive) {
      setPhase("live");
    } else {
      setPhase("withdrawal");
    }
  }, [data]);

  return (
    <div className="lotto-page-main">
      <Navbar />

      <h2 className="lotto-page-title">Current game</h2>
      <LottoUserActions
        phase={phase}
        lottoError={error}
        lottoDetails={data}
        fetchingLotto={isLoading}
        refetchCurrentGame={fetchCurrentGame}
      />
      <div className="lotto-page">
        {isLoading ? (
          <EmptyState title={"Fetching current game"} isLoading />
        ) : error ? (
          <EmptyState
            isError
            title={"An error occurred while fetching game"}
            description={error?.message}
          />
        ) : (
          !!data && (
            <>
              <LottoDetails
                phase={phase}
                data={{
                  ..._.pick(
                    data,
                    "winMultiplier",
                    "maxPlayersAllowed",
                    "ticketFee",
                    "playersTicketBought",
                    "ticketingStart",
                    "ticketingDuration"
                  ),
                }}
                withdrawalStart={data?.withdrawalStart}
              />

              <LottoDetails
                phase={phase}
                data={{
                  luckyNumber: data?.luckyNumber,
                  maxGuessNumber: data?.maxGuessNumber,
                  "current-phase":
                    data?.ticketingStart + data?.ticketingDuration,
                  ..._.pick(data, "playersTicketChecked", "withdrawalStart"),
                }}
              />
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Lotto;
