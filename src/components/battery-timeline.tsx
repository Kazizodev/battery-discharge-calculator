import { useState } from 'react'
import { useQueryState } from 'nuqs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Battery, Zap, Clock, TrendingDown, BatteryCharging } from 'lucide-react'

type CalculatorMode = 'discharge' | 'charge'

const getBatteryColor = (percent: number): string => {
    if (percent >= 60) return 'from-emerald-400 to-teal-500'
    if (percent >= 30) return 'from-yellow-400 to-orange-500'
    return 'from-rose-400 to-red-500'
}

const getBgColor = (percent: number): string => {
    if (percent >= 60) return 'bg-emerald-50 border-emerald-200'
    if (percent >= 30) return 'bg-yellow-50 border-yellow-200'
    return 'bg-rose-50 border-rose-200'
}

export default function BatteryCalculator() {
    type ResultItem = { percent: number; hours: string; time: string }

    const [mode, setMode] = useQueryState<CalculatorMode>('mode', { defaultValue: 'discharge', parse: value => (value === 'charge' ? 'charge' : 'discharge'), serialize: value => value })
    const [load, setLoad] = useState<number>(0)
    const [soc, setSoc] = useState<number>(100)
    const [error, setError] = useState<string>('')
    const [voltage, setVoltage] = useState<number>(48)
    const [capacity, setCapacity] = useState<number>(15)
    const [results, setResults] = useState<ResultItem[]>([])
    const [isCalculating, setIsCalculating] = useState<boolean>(false)

    const LITHIUM_SAFETY_MIN = 10 // Minimum safe SOC for lithium batteries
    const LITHIUM_SAFETY_MAX = 100 // Maximum charge for lithium batteries

    // Clear results when mode changes
    const handleModeChange = (newMode: CalculatorMode) => {
        setMode(newMode)
        setResults([])
        setError('')
    }

    const calculateTimeline = (): void => {
        setError('')
        setIsCalculating(true)

        // Clear results first for visual feedback
        setResults([])

        if (isNaN(capacity) || capacity <= 0) {
            setIsCalculating(false)
            return setError('Enter a valid capacity > 0')
        }
        if (isNaN(load) || load <= 0) {
            setIsCalculating(false)
            return setError('Enter a valid load > 0')
        }
        if (isNaN(soc) || soc < 0 || soc > 100) {
            setIsCalculating(false)
            return setError('SOC must be between 0 and 100')
        }

        // Add small delay for visual feedback
        setTimeout(() => {
            const now = new Date()
            const loadKw = load / 1000
            const timeline = []

            if (mode === 'discharge') {
                // Discharge mode - go from current SOC down to 10% (safety limit)
                if (soc <= LITHIUM_SAFETY_MIN) {
                    setIsCalculating(false)
                    return setError(`Battery already at or below safe minimum (${LITHIUM_SAFETY_MIN}%)`)
                }

                const startPercent = Math.floor(soc / 10) * 10

                for (let percent = startPercent; percent >= LITHIUM_SAFETY_MIN; percent -= 10) {
                    if (percent > soc) continue

                    const energyDelta = (capacity * (soc - percent)) / 100
                    const timeHours = energyDelta / loadKw
                    const future = new Date(now.getTime() + timeHours * 3600 * 1000)

                    timeline.push({
                        percent,
                        hours: timeHours.toFixed(2),
                        time: Number.isFinite(timeHours) && timeHours >= 0 ? future.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                    })
                }
            } else {
                // Charge mode - go from current SOC up to 90% (safety limit)
                if (soc >= LITHIUM_SAFETY_MAX) {
                    setIsCalculating(false)
                    return setError(`Battery already at or above safe maximum (${LITHIUM_SAFETY_MAX}%)`)
                }

                const startPercent = Math.ceil(soc / 10) * 10

                for (let percent = startPercent; percent <= LITHIUM_SAFETY_MAX; percent += 10) {
                    if (percent < soc) continue

                    const energyDelta = (capacity * (percent - soc)) / 100
                    const timeHours = energyDelta / loadKw
                    const future = new Date(now.getTime() + timeHours * 3600 * 1000)

                    timeline.push({
                        percent,
                        hours: timeHours.toFixed(2),
                        time: Number.isFinite(timeHours) && timeHours >= 0 ? future.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                    })
                }
            }

            setResults(timeline)
            setIsCalculating(false)
        }, 50) // 50ms delay for visual feedback
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        calculateTimeline()
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-5 shadow-xl">
                        {mode === 'discharge' ? <Battery className="size-10 text-white" /> : <BatteryCharging className="size-10 text-white" />}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-3">Battery {mode === 'discharge' ? 'Discharge' : 'Charge'} Calculator</h1>
                    <p className="text-gray-600 text-xl">Calculate your lithium battery {mode === 'discharge' ? 'runtime' : 'charging time'}</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <Tabs value={mode} onValueChange={value => handleModeChange(value as CalculatorMode)} className="w-full">
                        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 h-14">
                            <TabsTrigger value="discharge" className="text-base">
                                <Battery className="size-5 mr-2" />
                                Discharge
                            </TabsTrigger>
                            <TabsTrigger value="charge" className="text-base">
                                <BatteryCharging className="size-5 mr-2" />
                                Charge
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 md:p-10">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Capacity Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="capacity" className="flex items-center text-gray-700 font-medium">
                                        <Zap className="size-4 mr-2 text-indigo-600" />
                                        Battery Capacity
                                    </Label>
                                    <div className="relative">
                                        <Input id="capacity" type="number" step="0.1" value={capacity} onChange={e => setCapacity(parseFloat(e.target.value))} className="pr-16 h-12 text-lg" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">kWh</span>
                                    </div>
                                </div>

                                {/* Voltage Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="voltage" className="flex items-center text-gray-700 font-medium">
                                        <TrendingDown className="size-4 mr-2 text-purple-600" />
                                        Battery Voltage
                                    </Label>
                                    <div className="relative">
                                        <Input id="voltage" type="number" value={voltage} onChange={e => setVoltage(parseFloat(e.target.value))} className="pr-12 h-12 text-lg" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">V</span>
                                    </div>
                                </div>

                                {/* Load Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="load" className="flex items-center text-gray-700 font-medium">
                                        <Zap className="size-4 mr-2 text-amber-600" />
                                        {mode === 'discharge' ? 'Current Load' : 'Charging Power'}
                                    </Label>
                                    <div className="relative">
                                        <Input id="load" type="number" value={load} onChange={e => setLoad(parseFloat(e.target.value))} className="pr-12 h-12 text-lg" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">W</span>
                                    </div>
                                </div>

                                {/* SOC Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="soc" className="flex items-center text-gray-700 font-medium">
                                        <Battery className="size-4 mr-2 text-emerald-600" />
                                        Current SOC
                                    </Label>
                                    <div className="relative">
                                        <Input id="soc" type="number" step="1" min="0" max="100" value={soc} onChange={e => setSoc(parseFloat(e.target.value))} className="pr-12 h-12 text-lg" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isCalculating}
                                className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50">
                                {isCalculating ? 'Calculating...' : 'Calculate Timeline'}
                            </Button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <Alert variant="destructive" className="mt-6 animate-fade-in">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Results */}
                        {results.length > 0 && (
                            <div className="mt-10 space-y-4 animate-in fade-in zoom-in">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
                                    <Clock className="size-6 mr-3 text-indigo-600" />
                                    {mode === 'discharge' ? 'Discharge Timeline' : 'Charging Timeline'}
                                    {load > 0 && voltage > 0 && (
                                        <span className="ml-2 text-lg font-normal text-gray-600">
                                            ({(load / voltage).toFixed(2)}A) ({(load / 240).toFixed(2)}cA)
                                        </span>
                                    )}
                                </h2>
                                <div className="space-y-3">
                                    {results.map((result, index) => (
                                        <div
                                            key={result.percent}
                                            className={`group p-4 md:p-5 ${getBgColor(
                                                result.percent
                                            )} border-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-slide-in`}
                                            style={{ animationDelay: `${index * 50}ms` }}>
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                                                <div className="flex items-center space-x-4 md:space-x-5 w-full md:w-auto">
                                                    <div
                                                        className={`size-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${getBatteryColor(
                                                            result.percent
                                                        )} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform`}>
                                                        <span className="text-white font-bold text-base md:text-lg">{result.percent}%</span>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-900 font-bold text-lg md:text-xl">{result.time}</div>
                                                        <div className="text-gray-600 text-sm md:text-base mt-1">
                                                            {result.hours} hours {mode === 'discharge' ? 'remaining' : 'to charge'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-20 h-3 bg-gray-200 rounded-full overflow-hidden mt-3 md:mt-0">
                                                    <div className={`h-full bg-gradient-to-r ${getBatteryColor(result.percent)} transition-all duration-500`} style={{ width: `${result.percent}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-base">
                    Real-time battery {mode === 'discharge' ? 'discharge' : 'charging'} calculations
                    {mode === 'discharge' ? ` (stops at ${LITHIUM_SAFETY_MIN}% for battery safety)` : ` (charges to ${LITHIUM_SAFETY_MAX}%)`}
                </div>
            </div>
        </div>
    )
}
