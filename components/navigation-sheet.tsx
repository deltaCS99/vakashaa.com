import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { NavMenu, type NavMenuItemConfig } from "@/components/nav-menu";
import { ReactNode } from "react";

interface NavigationSheetProps {
  items?: NavMenuItemConfig[];
  extraContent?: ReactNode;
}

export const NavigationSheet = ({ items = [], extraContent }: NavigationSheetProps) => {
  return (
    <Sheet>
      <VisuallyHidden>
        <SheetTitle>Navigation Menu</SheetTitle>
      </VisuallyHidden>

      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="px-6 py-3">
        <Logo />
        <NavMenu items={items} orientation="vertical" className="mt-6 [&>div]:h-full" />
        {extraContent ? <div className="mt-6">{extraContent}</div> : null}
      </SheetContent>
    </Sheet>
  );
};
