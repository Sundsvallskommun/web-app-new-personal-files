import { MinaMedarbetare } from '@components/my-employees/mina-medarbetare.component';
import React from 'react';

const MinaMedarbetareSida: React.FC = () => {
  return (
    <div className="w-full flex flex-col pt-40 gap-24">
      <MinaMedarbetare />
    </div>
  );
};

export default MinaMedarbetareSida;
