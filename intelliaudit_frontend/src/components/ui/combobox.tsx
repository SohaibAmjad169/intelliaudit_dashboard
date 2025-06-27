import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  label: string
  value: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
  searchPlaceholder?: string
  clearable?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  disabled = false,
  triggerClassName,
  contentClassName,
  searchPlaceholder = "Search...",
  clearable = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedOption = React.useMemo(() => 
    options.find((option) => option.value === value), 
    [options, value]
  )

  const handleSelect = React.useCallback((currentValue: string) => {
    if (currentValue === value && clearable) {
      onChange(null)
    } else {
      onChange(currentValue)
    }
    setOpen(false)
  }, [value, onChange, clearable])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", contentClassName)}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 