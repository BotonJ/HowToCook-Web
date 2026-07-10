import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-outline" />
        </div>
        <input
          ref={ref}
          type="text"
          className={cn(
            "w-full bg-surface-container input-zen rounded-full py-3 pl-11 pr-4",
            "text-on-surface placeholder:text-outline-variant text-body-md",
            "outline-none shadow-sm",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
