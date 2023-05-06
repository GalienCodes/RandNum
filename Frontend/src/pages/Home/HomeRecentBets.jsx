import gsap from "gsap";
import HomeBet from "./HomeBet";
import AnimatedBets from "./AnimatedBets";
import { useEffect, useRef } from "react";
import Icon from "../../components/common/Icon";
import { useApp } from "../../context/AppContext";
import EmptyState from "../../components/common/EmptyState";
import { useWindowWidth } from "@react-hook/window-size/throttled";

const HomeRecentBets = () => {
  const windowWidth = useWindowWidth();
  const { fetching, recentBets } = useApp();

  let betObj = [];
  let boxRef = useRef([]);
  useEffect(() => {
    if (fetching) return;

    for (let i = 0; i < boxRef.current.length; i++) {
      betObj[i] = boxRef.current[i];
    }

    let boxHeight = 278;
    let wrapHeight = (betObj.length - 1) * boxHeight;
    let wrap = gsap.utils.wrap(-boxHeight, wrapHeight);

    gsap.set(betObj, {
      y: function (i) {
        return i * boxHeight;
      },
    });

    function animate(delta) {
      gsap.to(betObj, {
        duration: 2,
        ease: "power1.inOut",
        y: `-=${delta}`,
        modifiers: {
          y: function (y) {
            return wrap(parseFloat(y)) + "px";
          },
        },
      });
    }

    animate(boxHeight);
    loop(boxHeight);

    function loop(boxHeight) {
      gsap.delayedCall(8, () => {
        animate(boxHeight);
        loop(boxHeight);
      });
    }

    // eslint-disable-next-line
  }, [fetching]);

  return (
    <div className="home-page__recent-bets">
      <div className="home-page__recent-bets__header">
        <div className="home-page__recent-bets__header-content">
          <p>Recent bets</p>
          <Icon.SoftStar />
        </div>
      </div>

      <div
        className="home-page__recent-bets__cards"
        id="recentBets"
        style={{
          overflow: windowWidth <= 1150 ? "scroll" : "hidden",
        }}
      >
        {fetching ? (
          <EmptyState
            title=""
            isLoading
            fullScreen
            parentHeight={windowWidth <= 1150}
          />
        ) : windowWidth > 1150 ? (
          <>
            <AnimatedBets />
          </>
        ) : (
          <>
            {recentBets?.map((bet, index) => (
              <HomeBet key={bet?._id} bet={bet} index={index} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeRecentBets;
