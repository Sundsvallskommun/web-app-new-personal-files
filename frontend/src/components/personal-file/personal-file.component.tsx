'use client';

import { PersonalFileEmployments } from "./personal-file-employemnts/personal-file-employments.component";

export const PersonalFile: React.FC = () => {

    return (
         <div>
            <h1 className="w-fit">
                Namn Namnsson
            </h1>

            <PersonalFileEmployments />
         </div>
    )
}