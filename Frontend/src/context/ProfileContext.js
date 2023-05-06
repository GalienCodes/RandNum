import _ from "lodash";
import axios from "axios";
import { useQuery } from "react-query";
import { isValidAddress } from "algosdk";
import { createContext, useContext, useEffect, useState } from "react";
import { getBalance } from "../utils/helpers";
import dayjs from "dayjs";
import { isToday } from "../helpers/date";

export const ProfileContext = createContext({
  addr: "",
  stats: null,
  search: "",
  profile: null,
  profileData: [],
  // txnHistory: [],
  // errorTxns: null,
  errorDets: null,
  // fetchingTxns: false,
  fetchingDets: false,
  setAddr: () => {},
  setSearch: () => {},
  filteredProfileData: [],
});

export default function ProfileProvider({ children }) {
  const [addr, setAddr] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(null);
  const [profileData, setProfileData] = useState([]);
  const [filteredProfileData, setFilteredProfileData] = useState([]);

  const fetchData = route => {
    return () => axios.get(route).then(response => response?.data?.data);
  };

  const {
    data: profile,
    refetch: refetchProfile,
    isLoading: fetchingDets,
    error: errorDets,
  } = useQuery("profile", fetchData(`/profile/${addr}`), {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isValidAddress(addr),
  });

  // const {
  //   data: txnHistory,
  //   isLoading: fetchingTxns,
  //   error: errorTxns,
  // } = useQuery("lottoPayTXnHistory", fetchData(`/lottoPayTXnHistory`), {
  //   retry: false,
  //   refetchOnWindowFocus: false,
  //   enabled: isValidAddress(addr),
  // });

  const updateAddress = async addr => {
    isValidAddress(addr) && setAddr(addr);
  };

  useEffect(() => {
    if (isValidAddress(addr)) refetchProfile();
    // eslint-disable-next-line
  }, [addr]);

  useEffect(() => {
    const processTxns = async () => {
      let totalPnl = 0;
      let totalGamesWon = 0;
      let totalAmountSpent = 0;

      profileData?.forEach(bet => {
        const numGuessed = bet?.userInteractions
          .filter(act => act.action === "enter_game")
          ?.sort((a, b) => a?.round - b?.round)[0]?.value;
        const wonBet = bet?.lottoParams?.luckyNumber === numGuessed;

        totalGamesWon = wonBet ? totalGamesWon + 1 : totalGamesWon;
        totalAmountSpent = totalAmountSpent + bet?.lottoParams?.ticketFee;
        totalPnl =
          totalPnl + (bet?.lottoParams?.ticketFee ?? 0) * (wonBet ? 1 : -1);
      });

      const balance = await getBalance(addr);

      setStats({
        balance,
        pnl: totalPnl / 1e6,
        gamesWon: totalGamesWon,
        gamesPlayed: profileData?.length,
        amountSpent: totalAmountSpent / 1e6,
      });
    };
    processTxns();

    // eslint-disable-next-line
  }, [profileData, profile]);

  useEffect(() => {
    if (!profile) return;
    setProfileData(Object?.values(profile) ?? []);
  }, [profile]);

  // Filter the bets history
  useEffect(() => {
    if (search) {
      const filtered = profileData?.filter(bet => {
        return (
          _.values(_.omit(bet?.lottoParams, ["_id"])).filter(txt => {
            return typeof txt === "string" || typeof txt === "number"
              ? (txt + "")
                  .toLowerCase()
                  ?.includes(search?.toLowerCase()?.trim())
              : false;
          }).length > 0 ||
          (!isNaN(bet?.lottoParams?.withdrawalStart) &&
            dayjs(Number(bet?.lottoParams?.withdrawalStart) * 1000)
              .format(
                isToday(
                  new Date(Number(bet?.lottoParams?.withdrawalStart) * 1000)
                )
                  ? "HH:mm"
                  : "HH:mm, MMM DD"
              )
              ?.toLowerCase()
              ?.includes(search.toLowerCase().trim()))
        );
      });

      setFilteredProfileData(filtered);
    } else {
      setFilteredProfileData(profileData);
    }
  }, [search, profileData]);

  return (
    <ProfileContext.Provider
      value={{
        addr,
        stats,
        search,
        profile,
        profileData,
        filteredProfileData,
        // txnHistory: txnHistory ?? [],

        setAddr: updateAddress,
        setSearch,

        // errorTxns,
        errorDets,
        // fetchingTxns,
        fetchingDets,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
