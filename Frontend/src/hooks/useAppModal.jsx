import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const useAppModal = (defaultState = false, shouldNavigate = false) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [isOpen, setIsOpen] = useState(defaultState);

  const closeModal = () => {
    if (shouldNavigate) {
      document.body.classList.remove("no-scroll");
      if (state?.prevPath) {
        return navigate(-1, {
          replace: true,
        });
      } else {
        navigate(`/history`, {
          relative: false,
        });
      }
    } else {
      setIsOpen(false);
      document.body.classList.remove("no-scroll");
    }
  };

  const openModal = () => {
    setIsOpen(true);
    document.body.classList.add("no-scroll");
  };

  const AppModal = ({ isCentered, children, newGame }) => {
    return (
      <>
        {isOpen && (
          <>
            <div className="app-modal-overlay" onClick={closeModal}></div>
            <div
              className={`app-modal ${isCentered ? "app-modal-centered" : ""} ${
                newGame ? "new-game" : ""
              } `}
            >
              {children}
            </div>
          </>
        )}
      </>
    );
  };

  return [AppModal, closeModal, openModal, isOpen];
};

export default useAppModal;
