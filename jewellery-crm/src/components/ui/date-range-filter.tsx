"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangeFilterProps {
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  className?: string
  placeholder?: string
  showPresets?: boolean
  presets?: Array<{
    label: string
    value: string
    getDateRange: () => DateRange
  }>
}

const defaultPresets = [
  {
    label: "Today",
    value: "today",
    getDateRange: () => {
      const today = new Date()
      return { from: today, to: today }
    }
  },
  {
    label: "Yesterday", 
    value: "yesterday",
    getDateRange: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: yesterday, to: yesterday }
    }
  },
  {
    label: "Last 7 days",
    value: "last7days", 
    getDateRange: () => {
      const today = new Date()
      const lastWeek = new Date()
      lastWeek.setDate(today.getDate() - 7)
      return { from: lastWeek, to: today }
    }
  },
  {
    label: "Last 30 days",
    value: "last30days",
    getDateRange: () => {
      const today = new Date()
      const lastMonth = new Date()
      lastMonth.setDate(today.getDate() - 30)
      return { from: lastMonth, to: today }
    }
  },
  {
    label: "This week",
    value: "thisWeek",
    getDateRange: () => {
      const today = new Date()
      const startOfWeek = new Date(today)
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      return { from: startOfWeek, to: today }
    }
  },
  {
    label: "This month",
    value: "thisMonth",
    getDateRange: () => {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: startOfMonth, to: today }
    }
  },
  {
    label: "Last month",
    value: "lastMonth",
    getDateRange: () => {
      const today = new Date()
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: startOfLastMonth, to: endOfLastMonth }
    }
  }
]

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  className,
  placeholder = "Pick a date range",
  showPresets = true,
  presets = defaultPresets
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState<string>("")

  const handlePresetChange = (presetValue: string) => {
    if (presetValue === "custom") {
      setSelectedPreset("custom")
      return
    }

    const preset = presets.find(p => p.value === presetValue)
    if (preset) {
      const newDateRange = preset.getDateRange()
      onDateRangeChange?.(newDateRange)
      setSelectedPreset(presetValue)
    }
  }

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    onDateRangeChange?.(newDateRange)
    if (newDateRange?.from && newDateRange?.to) {
      setSelectedPreset("custom")
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return placeholder
    
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
    }
    
    return format(dateRange.from, "MMM dd, yyyy")
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showPresets && (
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Quick select" />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export type { DateRangeFilterProps }











