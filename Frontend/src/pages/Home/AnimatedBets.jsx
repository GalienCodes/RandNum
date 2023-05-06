import React, { useEffect, useRef } from "react";
import { constrictAddr } from "../../utils/helpers";
import { useApp } from "../../context/AppContext";
import { gsap } from "gsap";
import Icon from "../../components/common/Icon";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const AnimatedBets = () => {
  let betObj = [];
  let boxRef = useRef([]);
  const linkRef = useRef([]);
  const navigation = useNavigate();
  const { fetching, recentBets } = useApp();

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
      gsap.delayedCall(10, () => {
        animate(boxHeight);
        loop(boxHeight);
      });
    }

    // eslint-disable-next-line
  }, [fetching]);

  return (
    <>
      {recentBets?.map((bet, index) => (
        <div
          key={bet?._id}
          onClick={e => {
            if (linkRef.current && linkRef.current.includes(e.target)) {
              return;
            }
            navigation("/history/" + bet?._id);
          }}
          className="home-page__recent-bets__card animated"
          ref={el => (boxRef.current[index] = el)}
        >
          <div className="header">
            <div className="header__row">
              <div className="header__row__betId">
                {/* <p>0a51c-544b</p> */}
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
                aria-label="transaction-reference"
                target="_blank"
                rel="noreferrer"
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
      ))}
    </>
  );
};

export default AnimatedBets;
