import React, { Suspense } from "react";
import Icon from "./components/common/Icon";
import AppProvider from "./context/AppContext";
import ProfileProvider from "./context/ProfileContext";
import { QueryClient, QueryClientProvider } from "react-query";

export default function Providers({ children }) {
  const queryClient = new QueryClient();
  const renderFallback = () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon.Logo />
    </div>
  );

  return (
    <Suspense fallback={renderFallback()}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </AppProvider>
      </QueryClientProvider>
    </Suspense>
  );
}
