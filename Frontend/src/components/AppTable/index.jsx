import Icon from "../common/Icon";
import Searchbar from "../Searchbar";
import useAppMenu from "../../hooks/useAppMenu";
import useAppModal from "../../hooks/useAppModal";
import BetHistoryDetails from "./BetHistoryDetails";
import CSVButton from "./CSVButton";
import EmptyState from "../common/EmptyState";
import { useApp } from "../../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useWindowWidth } from "@react-hook/window-size/throttled";
import TableRow from "./TableRow";

const AppTable = () => {
  let { betId } = useParams();
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const [BetHistoryTab, closeHistoryTab] = useAppModal(true, true);
  const [AppMenu, activeOption] = useAppMenu("all", ["all", "duration"]);

  const {
    search,
    setSearch,
    filteredBetsHistory,
    isEmptyHistory,
    fetching,
    errorHistory,
  } = useApp();

  const [currentBet, setCurrentBet] = useState(null);

  const openSideModal = async bet_id => {
    navigate(`/history/${bet_id}`, {
      state: {
        prevPath: window.location.pathname,
      },
    });
  };

  useEffect(() => {
    if (!betId) {
      document.body.classList.remove("no-scroll");
      return;
    }
    const bet = filteredBetsHistory?.find(bet => bet._id === betId);
    if (!bet) return;
    document.body.classList.add("no-scroll");
    setCurrentBet(bet);
  }, [betId, filteredBetsHistory]);

  return (
    <>
      <div className="app-table-header">
        {/* <div className="app-table-header__title-cover">
          <h2 className="app-table-header__title">Gaming history</h2>
          <h2 className="app-table-header__title">120 Games</h2>
        </div> */}

        <div className="app-table-header__row">
          <Searchbar search={search} setSearch={setSearch} />

          <div className="action-btns">
            <AppMenu>
              <button
                className="action-btn"
                style={{
                  width: windowWidth > 722 ? "auto" : "38px",
                  padding: windowWidth > 722 ? "2px 15px" : "0px",
                  borderRadius: windowWidth > 722 ? "8px" : "300px",
                }}
              >
                <Icon.Filter />
                {windowWidth > 722 ? <p>{activeOption}</p> : <></>}
              </button>
            </AppMenu>

            <CSVButton
              csvData={filteredBetsHistory || []}
              csvFileName={"Randnum-bets-history"}
            />
          </div>
        </div>
      </div>

      {fetching ? (
        <EmptyState isLoading={true} title={"Fetching bets history"} />
      ) : errorHistory ? (
        <EmptyState
          isError
          title={"An error occurred while fetching bets history"}
          description={errorHistory?.message}
        />
      ) : (
        <div className="app-table">
          <div className="app-table__row app-table__row__header">
            <div className="app-table__row__item betId">Bet Id</div>
            <div className="app-table__row__item amt">Lucky No</div>
            <div className="app-table__row__item amt">Tcket Fee</div>
            <div className="app-table__row__item walletAddr">Game Master</div>
            <div className="app-table__row__item winners">Multiplier</div>
            <div className="app-table__row__item date">Closed</div>
            <div className="app-table__row__item date">Duration</div>
          </div>

          {Boolean(filteredBetsHistory?.length > 0) ? (
            filteredBetsHistory?.map((bet, index) => {
              return (
                <TableRow
                  key={index}
                  betItem={bet}
                  openSideModal={openSideModal}
                />
              );
            })
          ) : isEmptyHistory ? (
            <EmptyState emptyList={true} title={`No bet history yet`} />
          ) : (
            <EmptyState noMatch={true} title={`No bet matched your search`} />
          )}
        </div>
      )}

      {betId && (
        <BetHistoryTab>
          <BetHistoryDetails
            bet={currentBet}
            closeHistoryTab={closeHistoryTab}
          />
        </BetHistoryTab>
      )}
    </>
  );
};

export default AppTable;
