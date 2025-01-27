import { memo } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { RoutePaths } from '../../constants.js'
import { RouterDialog } from './RouterDialog.js'

export const SmartPayDialog = memo(() => {
    const entries = [RoutePaths.Deploy, RoutePaths.InEligibility, RoutePaths.Main]

    return (
        <MemoryRouter initialEntries={entries} initialIndex={1}>
            <RouterDialog />
        </MemoryRouter>
    )
})
