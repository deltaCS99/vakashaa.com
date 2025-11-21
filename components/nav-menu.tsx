import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type NavMenuItemConfig = {
  href: string;
  label: string;
  isActive?: boolean;
};

interface NavMenuProps extends ComponentProps<typeof NavigationMenu> {
  items?: NavMenuItemConfig[];
}

export const NavMenu = ({ items = [], className, ...props }: NavMenuProps) => (
  <NavigationMenu {...props} className={cn("max-w-max", className)}>
    <NavigationMenuList className="flex gap-6 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
      {items.map((item) => (
        <NavigationMenuItem key={item.href}>
          <NavigationMenuLink
            asChild
            className={cn(
              "inline-flex h-auto items-center justify-center rounded-none border-0 bg-transparent p-0 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground border-b-2 border-transparent pb-1",
              item.isActive && "text-amber-600 border-amber-600"
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);
