import { Link, LinkProps, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const NavLink = ({
  to,
  activeClassName = "bg-primary text-primary-foreground",
  end = false,
  children,
  className,
  ...props
}: NavLinkProps) => {
  const location = useLocation();
  const isActive = end
    ? location.pathname === to
    : location.pathname.startsWith(to.toString());

  return (
    <Link
      to={to}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  );
};
