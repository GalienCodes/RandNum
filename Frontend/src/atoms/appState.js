import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const addressAtom = atom({
  default: "",
  key: "address",
  effects_UNSTABLE: [persistAtom],
});
export const providerAtom = atom({
  default: "",
  key: "provider",
  effects_UNSTABLE: [persistAtom],
});
