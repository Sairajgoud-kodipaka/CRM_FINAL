"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { X, Settings } from "lucide-react"
import { useState } from "react"

interface WeightRangeSliderProps {
  minWeight: number
  maxWeight: number
  currentWeight: number
  onWeightChange: (weight: number) => void
  unit: string
  className?: string
}

const WeightRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  WeightRangeSliderProps
>(({ minWeight, maxWeight, currentWeight, onWeightChange, unit, className }, ref) => {
  const [localWeight, setLocalWeight] = useState<number>(currentWeight || 0)
  const [isOpen, setIsOpen] = useState(false)

  // Update local weight when currentWeight prop changes
  React.useEffect(() => {
    setLocalWeight(currentWeight || 0)
  }, [currentWeight])

  const handleWeightChange = (newWeight: number[]) => {
    const weight = newWeight[0]
    if (typeof weight === 'number' && !isNaN(weight)) {
      setLocalWeight(weight)
    }
  }

  const handleApply = () => {
    if (typeof localWeight === 'number' && !isNaN(localWeight)) {
      onWeightChange(localWeight)
      setIsOpen(false)
    }
  }

  const handleReset = () => {
    setLocalWeight(currentWeight)
  }

  const formatWeight = (weight: number) => {
    return `${(weight || 0).toFixed(1)}${unit}`
  }

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-sm text-gray-600">
            Selected Weight: {formatWeight(currentWeight || 0)}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-8 w-8 p-0 hover:bg-blue-50"
          title="Click to customize weight"
        >
          <Settings className="h-4 w-4 text-blue-600" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Customize Weight</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Weight Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-xs text-blue-600 mb-2">Current Weight Selection</div>
        <div className="text-2xl font-bold text-blue-800">
          {formatWeight(localWeight || 0)}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Drag the slider to adjust weight
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <SliderPrimitive.Root
          ref={ref}
          className="relative flex w-full touch-none select-none items-center"
          value={[localWeight]}
          onValueChange={handleWeightChange}
          min={minWeight}
          max={maxWeight}
          step={0.1}
        >
          <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110" />
        </SliderPrimitive.Root>

        {/* Weight Range Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatWeight(minWeight)}</span>
          <span>{formatWeight(maxWeight)}</span>
        </div>
      </div>

      {/* Weight Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-xs text-gray-600 mb-1">Weight Details</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Distance from Min:</div>
            <div className="font-medium text-gray-800">
              {formatWeight((localWeight || 0) - minWeight)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Distance to Max:</div>
            <div className="font-medium text-gray-800">
              {formatWeight(maxWeight - (localWeight || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
          Reset
        </Button>
        <Button size="sm" onClick={handleApply} className="flex-1">
          Apply Weight
        </Button>
      </div>
    </div>
  )
})

WeightRangeSlider.displayName = "WeightRangeSlider"

export { WeightRangeSlider }
