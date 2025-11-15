import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
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
  items: NavMenuItemConfig[];
}

export const NavMenu = ({ items, className, ...props }: NavMenuProps) => (
  <NavigationMenu {...props} className={cn("max-w-max", className)}>
    <NavigationMenuList className="space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
      {items.map((item) => (
        <NavigationMenuItem key={item.href}>
          <NavigationMenuLink
            asChild
            className={cn(
              navigationMenuTriggerStyle(),
              "h-9 rounded-full border-0 bg-transparent px-4 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground",
              item.isActive && "text-foreground"
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);
