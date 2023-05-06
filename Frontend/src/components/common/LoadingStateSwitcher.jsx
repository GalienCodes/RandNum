import React from "react";

export const LoadingStateSwitcher = React.memo(({ isLoading, children }) => {
  if (isLoading) {
    return <></>;
  }
  return <>{children}</>;
});
