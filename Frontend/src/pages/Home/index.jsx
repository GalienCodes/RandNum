import "./index.scss";
import HomeRecentBets from "./HomeRecentBets";
import HomeDescription from "./HomeDescription";

const Home = () => {
  return (
    <div className="home-page">
      <HomeDescription />
      <HomeRecentBets />
    </div>
  );
};

export default Home;
