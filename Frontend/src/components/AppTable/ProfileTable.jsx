import dayjs from "dayjs";
import millify from "millify";
import { useState } from "react";
import Icon from "../common/Icon";
import CSVButton from "./CSVButton";
import Searchbar from "../Searchbar";
import EmptyState from "../common/EmptyState";
import useAppMenu from "../../hooks/useAppMenu";
import useAppModal from "../../hooks/useAppModal";
import ProfileBetDetails from "./ProfileBetDetails";
import { constrictAddr } from "../../utils/helpers";
import { useProfile } from "../../context/ProfileContext";
import { useWindowWidth } from "@react-hook/window-size/throttled";

const ProfileTable = () => {
  const windowWidth = useWindowWidth();
  const [currentBet, setCurrentBet] = useState(null);
  const [AppMenu, activeOption] = useAppMenu("all", ["all", "won"]);
  const [BetDetailsTab, closeDetailsTab, openDetailsTab] = useAppModal();

  const {
    addr,
    search,
    profile,
    errorDets,
    setSearch,
    profileData,
    fetchingDets,
    filteredProfileData,
  } = useProfile();

  return (
    <>
      <div className="app-table-header">
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
              csvData={profileData?.map(bet => bet?.lottoParams) || []}
              csvFileName={`${addr ? addr : "profile"}-bets-history`}
            />
          </div>
        </div>
      </div>

      {fetchingDets || (profileData?.length === 0 && !profile && addr) ? (
        <EmptyState isLoading={true} title={"Fetching bets history"} />
      ) : errorDets ? (
        <EmptyState
          isError
          title={"An error occurred while fetching bets history"}
          description={errorDets?.message}
        />
      ) : profileData?.length === 0 && !addr ? (
        <EmptyState
          title={"No bets history found"}
          description={
            "Please enter a valid wallet address to view bets history"
          }
        />
      ) : (
        <div className="app-table">
          <div className="app-table__row app-table__row__header">
            <div className="app-table__row__item betId">Bet Id</div>
            <div className="app-table__row__item lucky-no">Lucky No</div>
            <div className="app-table__row__item amt staked">Stake</div>
            <div className="app-table__row__item guessed">Guess</div>
            <div className="app-table__row__item amt">Result</div>
            <div className="app-table__row__item date">Closed</div>
          </div>

          {Boolean(filteredProfileData?.length > 0) ? (
            filteredProfileData?.map((bet, index) => {
              const numGuessed = bet?.userInteractions
                .filter(act => act.action === "enter_game")
                ?.sort((a, b) => a?.round - b?.round)[0]?.value;
              const wonBet = bet?.lottoParams?.luckyNumber === numGuessed;

              return (
                <div
                  key={index}
                  className="app-table__row"
                  onClick={e => {
                    setCurrentBet(bet);
                    openDetailsTab();
                  }}
                >
                  <div className="app-table__row__item betId">
                    <p>{constrictAddr(bet?.id, 4, 5)}</p>
                  </div>

                  <div className="app-table__row__item lucky-no">
                    {new Date().getTime() <
                    bet?.lottoParams?.withdrawalStart * 1000 ? (
                      <p className="indicator indicator-pending">Pending</p>
                    ) : (
                      bet?.lottoParams?.luckyNumber ?? 0
                    )}
                  </div>

                  <div className="app-table__row__item amt staked">
                    <Icon.AlgoRound />
                    <p>
                      {!!bet?.lottoParams?.ticketFee
                        ? millify((bet?.lottoParams?.ticketFee ?? 0) / 1e6, {
                            precision: 1,
                          })
                        : "N/A"}
                    </p>
                  </div>

                  <div className="app-table__row__item guessed">
                    <p>{numGuessed}</p>
                  </div>

                  <div className="app-table__row__item amt">
                    {!!bet?.lottoParams?.ticketFee ? (
                      <p
                        className={`indicator indicator-${
                          wonBet ? "success" : "failed"
                        }`}
                      >
                        {wonBet ? "Won" : "Lost"}
                      </p>
                    ) : (
                      <p className="indicator indicator-pending">Pending</p>
                    )}
                  </div>

                  <div className="app-table__row__item date">
                    <p>
                      {!isNaN(bet?.lottoParams?.withdrawalStart) &&
                        dayjs(
                          Number(bet?.lottoParams?.withdrawalStart) * 1000
                        ).format("HH:mm, MMM DD")}
                    </p>
                  </div>
                </div>
              );
            })
          ) : profileData?.length === 0 ? (
            <EmptyState
              emptyList={true}
              title={"This wallet has not placed any bets yet!"}
            />
          ) : (
            <EmptyState noMatch={true} title={`No bet matched your search`} />
          )}
        </div>
      )}

      <BetDetailsTab>
        {currentBet && (
          <ProfileBetDetails
            details={currentBet}
            closeDetailsTab={closeDetailsTab}
          />
        )}
      </BetDetailsTab>
    </>
  );
};

export default ProfileTable;
