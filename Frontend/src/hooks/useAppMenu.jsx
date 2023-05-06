import { useState } from "react";
import { Menu, MenuItem } from "@szhsin/react-menu";

const useAppMenu = (defaultOption = null, items) => {
  const [activeOption, setActiveOption] = useState(defaultOption || items[0]);

  const AppMenu = ({ children }) => {
    return (
      <div className="app-menu__container">
        <Menu
          align="end"
          transition
          menuButton={children}
          menuClassName="app-menu"
          onItemClick={e => setActiveOption(e.value)}
        >
          {items?.map((slug, ind) => (
            <MenuItem
              data-active={slug === activeOption}
              value={slug}
              key={ind}
              className="menu-item"
            >
              <p>{slug}</p>
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  };

  return [AppMenu, activeOption];
};

export default useAppMenu;
