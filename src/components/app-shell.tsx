import { SidePanel } from "./side-menu";
import { getMenuProps } from "./menu-props";

// Computers: the side menu stays pinned beside every page. Phones open it from the menu button in the header.
export async function AppShell({ children }: { children: React.ReactNode }) {
  const menu = await getMenuProps();
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 lg:px-4 lg:pt-4">
      <SidePanel {...menu} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
