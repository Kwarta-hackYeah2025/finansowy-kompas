import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, required, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
      className
    )}
    {...props}
  >
    {children}
    {required ? <span className="text-destructive ml-0.5">*</span> : null}
  </label>
))

Label.displayName = "Label"

export { Label }

