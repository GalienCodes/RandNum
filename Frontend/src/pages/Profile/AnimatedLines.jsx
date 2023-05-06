import { Fragment, useEffect } from "react";
import random from "canvas-sketch-util/random";

const AnimatedLines = () => {
  const updateLines = () => {
    [...document.getElementsByClassName("animated-lines__row-item")].forEach(
      el => {
        const element = el.getBoundingClientRect();
        var dx = 60 - (element.left + element.width / 2);
        var dy = 154 - (element.top + element.height / 2);
        var transform = "rotate(" + Math.atan2(dy, dx) + "rad)";
        el.style.transform = transform;
      }
    );
  };

  useEffect(() => {
    updateLines();
  }, []);

  return (
    <div className="animated-lines">
      {[...Array(8).keys()].map(i => (
        <div key={i} className="animated-lines__row">
          <Fragment key={i}>
            {[...Array(8).keys()].map(j => (
              <div className="animated-lines__row-item" key={j}></div>
            ))}
          </Fragment>
        </div>
      ))}
    </div>
  );
};

export default AnimatedLines;
