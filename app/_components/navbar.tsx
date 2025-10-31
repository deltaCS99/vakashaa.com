// app/_components/navbar.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  UserRound,
  LayoutDashboard,
  MessageSquareQuote,
  Calendar,
  User,
  Settings,
  MapPin,
  Users,
  BarChart3,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { handleSignOut } from "@/actions/login"

interface NavbarProps {
  user: any
}

function AnimatedLogo() {
  return (
    <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent min-w-[140px]">
      Vakashaa
    </h1>
  )
}

function NavLinks() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="hidden md:flex items-center gap-1">
      <Button variant="ghost" asChild className={isActive("/") && pathname === "/" ? "bg-accent" : ""}>
        <Link href="/">Tours</Link>
      </Button>
      <Button variant="ghost" asChild className={isActive("/blog") ? "bg-accent" : ""}>
        <Link href="/blog">Blog</Link>
      </Button>
      <Button variant="ghost" asChild className={isActive("/about") ? "bg-accent" : ""}>
        <Link href="/about">About</Link>
      </Button>
    </div>
  )
}

function AuthNav({ user }: { user: any }) {
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="pr-4 rounded-none h-fit flex gap-x-2 focus-visible:ring-offset-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback>
              <UserRound className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* User Profile Card */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback>
                <UserRound className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-1">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Customer Navigation */}
        {user.role === "User" && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">My Travel</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/quotes" className="cursor-pointer">
                <MessageSquareQuote className="mr-2 h-4 w-4" />
                My Quotes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bookings" className="cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" />
                My Bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        {/* Operator Navigation */}
        {user.role === "Operator" && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Operator Portal</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/operator/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/operator/tours" className="cursor-pointer">
                <MapPin className="mr-2 h-4 w-4" />
                My Tours
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/operator/quotes" className="cursor-pointer">
                <MessageSquareQuote className="mr-2 h-4 w-4" />
                Quote Requests
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        {/* Admin Navigation */}
        {user.role === "Admin" && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Admin Panel</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/blog" className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Blog
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/operators" className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Operators
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/tours" className="cursor-pointer">
                <MapPin className="mr-2 h-4 w-4" />
                All Tours
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/quotes" className="cursor-pointer">
                <MessageSquareQuote className="mr-2 h-4 w-4" />
                All Quotes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/analytics" className="cursor-pointer">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <form action={handleSignOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer text-red-600">
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Navbar({ user }: NavbarProps) {
  const isOperator = user?.role === "Operator"
  const isAdmin = user?.role === "Admin"

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-white border-b px-4 md:px-6 h-16 shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <AnimatedLogo />
        </Link>

        {/* Main Navigation */}
        <NavLinks />
      </div>

      <div className="flex items-center gap-3">
        {user && !isOperator && !isAdmin && (
          <Button
            variant="outline"
            asChild
            className="hidden md:inline-flex border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white bg-transparent"
          >
            <Link href="/operator/apply">
              <Users className="mr-2 h-4 w-4" />
              Become a Tour Operator
            </Link>
          </Button>
        )}

        {/* Auth Navigation */}
        <AuthNav user={user} />
      </div>
    </nav>
  )
}
