

import SokPersonakter from "@components/personal-files/sok-personakter.component";
import Main from "@layouts/main/main.component";
import React from "react";

const SokPersonakterSida: React.FC = () => {

  return (
    <Main data-cy="state">
    <SokPersonakter />
    </Main>
  );
};

export default SokPersonakterSida;
