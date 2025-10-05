import { NuqsAdapter } from 'nuqs/adapters/react'
import BatteryCalculator from './battery-timeline'

export default function BatteryCalculatorWrapper() {
    return (
        <NuqsAdapter>
            <BatteryCalculator />
        </NuqsAdapter>
    )
}
