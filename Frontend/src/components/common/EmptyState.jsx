import React from "react";
import { SpinnerCircular } from "spinners-react";
import Illustration from "./Illustration";

const EmptyState = ({
  fullScreen,
  size,
  loaderSize,
  title,
  description,
  isError,
  isLoading,
  noMatch,
  emptyList,
  parentHeight,
}) => {
  return (
    <div
      className="empty-state-container"
      style={{
        minHeight: parentHeight ? "0px" : "60vh",
        padding: `${fullScreen ? "0px" : "70px"} 24px calc(min(8%, 24px))`,
        justifyContent: fullScreen ? "center" : "start",
      }}
    >
      {isLoading ? (
        <SpinnerCircular
          size={!isNaN(loaderSize) ? loaderSize : 50}
          color="#777"
          secondaryColor="#ccc"
        />
      ) : emptyList ? (
        <Illustration.EmptyArray size={130} />
      ) : noMatch ? (
        <Illustration.EmptySpace size={136} />
      ) : isError ? (
        <Illustration.EmptySpace size={136} />
      ) : (
        <Illustration.Empty size={!isNaN(size) ? size : 150} />
      )}

      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
    </div>
  );
};

export default EmptyState;
