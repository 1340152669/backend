import { useState, useRef, useEffect } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, ChevronDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({ options, value, onChange, placeholder = "请选择", searchPlaceholder = "搜索...", className, disabled }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selectedOptions = options.filter(o => value.includes(o.value))

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter(v => v !== val) : [...value, val])
  }

  const remove = (val: string) => {
    onChange(value.filter(v => v !== val))
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex min-h-9 w-full items-center gap-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm",
            "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            "flex-wrap",
            className
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map(o => (
              <Badge key={o.value} variant="secondary" className="gap-0.5 pr-0.5 text-xs">
                {o.label}
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  onClick={e => { e.stopPropagation(); remove(o.value) }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover shadow-md"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="border-b p-2">
            <div className="flex items-center gap-1.5 rounded-sm border border-input bg-transparent px-2 text-sm">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">无匹配结果</div>
            ) : (
              filtered.map(o => {
                const selected = value.includes(o.value)
                return (
                  <div
                    key={o.value}
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selected && "bg-accent"
                    )}
                    onClick={() => toggle(o.value)}
                  >
                    <span className="flex-1">{o.label}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
