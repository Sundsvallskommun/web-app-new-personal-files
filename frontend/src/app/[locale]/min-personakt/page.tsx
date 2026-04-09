

import MinPersonakt from "@components/personal-files/min-personakt.component";
import Main from "@layouts/main/main.component";
import React from "react";

const MinPersonaktSida: React.FC = () => {

  return (
    <Main data-cy="state">
    <MinPersonakt />
    </Main>
  );
};

export default MinPersonaktSida;
