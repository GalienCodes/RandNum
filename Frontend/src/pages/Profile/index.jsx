import "./index.scss";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import ProfileStats from "./ProfileStats";
import { useParams } from "react-router-dom";
import { addressAtom } from "../../atoms/appState";
import Navbar from "../../components/layout/Navbar";
import { useProfile } from "../../context/ProfileContext";
import ProfileTable from "../../components/AppTable/ProfileTable";

const Profile = () => {
  let { address } = useParams();
  const { setAddr } = useProfile();
  const walletAddress = useRecoilValue(addressAtom);

  useEffect(() => {
    const addr = !address ? walletAddress : address;
    setAddr(addr);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="profile-page">
      <Navbar />
      <ProfileStats />
      <ProfileTable />
    </div>
  );
};

export default Profile;
