import axios from "axios";
import { useQuery } from "react-query";
import { createContext, useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import _ from "lodash";
import { isToday } from "../helpers/date";
import { mode } from "../helpers/array";
import { addressAtom } from "../atoms/appState";
import { useRecoilValue } from "recoil";
import { getBalance } from "../utils/helpers";

export const AppContext = createContext({
  search: "",
  acctBalance: 0,
  ticketSold: 0,
  mostRecurring: 0,
  recentBets: [],
  errorHistory: null,
  fetching: false,
  betsHistory: [],
  filteredBetsHistory: [],
  isEmptyHistory: false,
  refetchHistory: () => {},
  setSearch: () => {},
});

export default function AppProvider({ children }) {
  const [search, setSearch] = useState("");
  const [ticketSold, setTicketSold] = useState(0);
  const [recentBets, setRecentBets] = useState([]);
  const [acctBalance, setAcctBalance] = useState(0);
  const [mostRecurring, setMostRecurring] = useState(0);
  const [filteredBetsHistory, setFilteredBetsHistory] = useState([]);

  const walletAddress = useRecoilValue(addressAtom);

  const { data, isLoading, error, refetch } = useQuery(
    "recentGames",
    () =>
      axios.get(`/allLottoIdHistory`).then(response => {
        if (response.data.data) {
          setRecentBets(response.data.data?.slice(0, 6));
        }
        return response?.data?.data;
      }),
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    }
  );

  useEffect(() => {
    if (!walletAddress) return;

    const getAccountBalance = async () => {
      const balance = await getBalance(walletAddress);
      setAcctBalance(
        isNaN(balance) ||
          balance === Infinity ||
          balance === -Infinity ||
          balance === 0
          ? 0
          : balance
      );
    };

    getAccountBalance();
  }, [walletAddress]);

  useEffect(() => {
    if (!data) return;
    // Sum the ticket prices
    const ticketSum = data?.reduce((acc, curr) => {
      return (
        acc +
        (curr?.gameParams?.ticketFee ?? 0) *
          (curr?.gameParams?.playersTicketBought ?? 0)
      );
    }, 0);

    setTicketSold(ticketSum / 1e6);

    // Check most occuring luckyNumber
    const luck = mode([...data].map(bet => bet?.gameParams?.luckyNumber));
    setMostRecurring(luck);
  }, [data]);

  // Filter bets by search
  useEffect(() => {
    if (search) {
      const filtered = data?.filter(bet => {
        return (
          bet?._id?.toLowerCase().includes(search) ||
          _.values(_.omit(bet?.gameParams, ["_id"])).filter(txt => {
            return typeof txt === "string" || typeof txt === "number"
              ? (txt + "")
                  .toLowerCase()
                  ?.includes(search?.toLowerCase()?.trim())
              : false;
          }).length > 0 ||
          (!isNaN(bet?.gameParams?.withdrawalStart) &&
            dayjs(Number(bet?.gameParams?.withdrawalStart) * 1000)
              .format(
                isToday(
                  new Date(Number(bet?.gameParams?.withdrawalStart) * 1000)
                )
                  ? "HH:mm"
                  : "HH:mm, MMM DD"
              )
              ?.toLowerCase()
              ?.includes(search.toLowerCase().trim()))
        );
      });
      setFilteredBetsHistory(filtered);
    } else {
      setFilteredBetsHistory(data);
    }
  }, [search, data]);

  return (
    <AppContext.Provider
      value={{
        search,
        setSearch,
        recentBets,
        ticketSold,
        acctBalance,

        mostRecurring,
        filteredBetsHistory,
        isEmptyHistory: !data?.length,

        errorHistory: error,
        betsHistory: data,
        fetching: isLoading,
        refetchHistory: refetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
