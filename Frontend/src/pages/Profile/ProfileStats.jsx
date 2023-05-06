import millify from "millify";
import Skeleton from "react-loading-skeleton";
import Icon from "../../components/common/Icon";
import { constrictAddr } from "../../utils/helpers";
import { useProfile } from "../../context/ProfileContext";

const ProfileStats = () => {
  const { addr, stats, fetchingDets, errorDets } = useProfile();

  return (
    <div className="profile-page__stats">
      <div className="profile-page__stat">
        <p className="address">
          {addr ? constrictAddr(addr, 6, 4) : "Invalid Address"}
        </p>
        <div className="row">
          {fetchingDets || errorDets ? (
            <h2>
              <Skeleton
                width={110}
                height={24}
                highlightColor={"#ccc"}
                enableAnimation={!errorDets}
              />
            </h2>
          ) : (
            <>
              <Icon.Algo />
              <h2>
                {!isNaN(stats?.balance)
                  ? millify(stats?.balance, { precision: 1 })
                  : 0}
              </h2>
            </>
          )}
        </div>
      </div>

      <div className="profile-page__stat played">
        <p>Games Played</p>
        <div className="row">
          <h2>
            {fetchingDets || errorDets ? (
              <Skeleton
                width={110}
                height={24}
                highlightColor={"#ccc"}
                enableAnimation={!errorDets}
              />
            ) : (
              stats?.gamesPlayed ?? 0
            )}
          </h2>
        </div>
      </div>

      <div className="profile-page__stat amt-paid">
        <p>Amount spent</p>
        <div className="row">
          {fetchingDets || errorDets ? (
            <h2>
              <Skeleton
                width={110}
                height={24}
                highlightColor={"#ccc"}
                enableAnimation={!errorDets}
              />
            </h2>
          ) : (
            <>
              <Icon.Algo />
              <h2>
                {!isNaN(stats?.amountSpent)
                  ? millify(stats?.amountSpent, { precision: 1 })
                  : 0}
              </h2>
            </>
          )}
        </div>
      </div>

      <div className="profile-page__stat">
        <p>Total PnL</p>

        {fetchingDets || errorDets ? (
          <div className="row">
            <h2>
              <Skeleton
                width={110}
                height={24}
                highlightColor={"#ccc"}
                enableAnimation={!errorDets}
              />
            </h2>
          </div>
        ) : (
          <div className={`row pnl ${!stats?.pnl && "inactive"}`}>
            <>
              <Icon.Algo />
              <h2 data-profit={stats?.pnl > 0}>
                {!isNaN(stats?.pnl)
                  ? millify(Math.abs(stats?.pnl), { precision: 1 })
                  : 0}
              </h2>
            </>
          </div>
        )}
      </div>

      <div className="profile-page__stat fav">
        <p>Games Won</p>
        <div className="row">
          <h2>
            {fetchingDets || errorDets ? (
              <Skeleton
                width={110}
                height={24}
                highlightColor={"#ccc"}
                enableAnimation={!errorDets}
              />
            ) : (
              stats?.gamesWon ?? 0
            )}
          </h2>
        </div>
      </div>
    </div>
  );
};
export default ProfileStats;
