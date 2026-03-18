import DefaultLayout from "@layouts/default-layout/default-layout.component";
import Main from "@layouts/main/main.component";
import React from "react";

export default function ExampleLayout({ children }: { children: React.ReactNode }) { 
    return (
            <DefaultLayout>
              <Main>
                {children}
              </Main>
              </DefaultLayout>
    )
}