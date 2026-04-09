import { ReactElement } from "react";

export interface ISidebarMenu {
  label: string;
  path: string;
  icon?: ReactElement;
  active: boolean;
}