import SokPersonakter from '@components/search-personal-files/sok-personakter.component';
import React from 'react';

const SokPersonakterSida: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-[10vh] gap-24">
      <SokPersonakter />
    </div>
  );
};

export default SokPersonakterSida;
