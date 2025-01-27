import { Box } from '@mui/material'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAsyncRetry } from 'react-use'
import { RequestPermission } from './RequestPermission.js'

const acceptable: readonly browser.permissions.Permission[] = [
    'alarms',
    'clipboardRead',
    'clipboardWrite',
    'contextMenus',
    'contextualIdentities',
    'menus',
    'notifications',
    'webRequestBlocking',
]
function isAcceptablePermission(x: string): x is browser.permissions.Permission {
    return (acceptable as string[]).includes(x)
}

export default function RequestPermissionPage() {
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const origins = params.getAll('origins')
    const permissions = params.getAll('permissions').filter(isAcceptablePermission)

    const { retry, value: hasPermission } = useAsyncRetry(
        () => browser.permissions.contains({ origins, permissions }),
        [location.search],
    )

    useEffect(() => {
        if (hasPermission) window.close()
    }, [hasPermission])
    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
            }}>
            <RequestPermission
                onCancel={() => window.close()}
                onRequestApprove={() => browser.permissions.request({ origins, permissions }).finally(retry)}
                origins={origins}
                permissions={permissions}
            />
        </Box>
    )
}
