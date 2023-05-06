import Icon from "./common/Icon";

const Searchbar = ({ search, setSearch }) => {
  return (
    <div className="search-bar">
      <div className="search-bar__icon">
        <Icon.Search />
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search transactions"
      />
    </div>
  );
};

export default Searchbar;
