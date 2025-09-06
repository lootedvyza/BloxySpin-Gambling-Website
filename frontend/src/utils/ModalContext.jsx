import React, { createContext, useState, useContext } from "react";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <ModalContext.Provider
      value={{ modalState, setModalState, loading, setLoading }}
    >
      {loading && (
        <div className="loadingContainer">
          <div className="loading"></div>
        </div>
      )}
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
