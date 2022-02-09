import { createInjectHooksRenderer, useActivatedPluginsSNSAdaptor } from '@masknet/plugin-infra'
import { EvmContextProvider } from '../../plugins/EVM/contexts'

const PluginRenderer = createInjectHooksRenderer(
    useActivatedPluginsSNSAdaptor.visibility.useNotMinimalMode,
    (x) => x.SearchResultBox,
)

export interface SearchResultBoxProps {}

export function SearchResultBox(props: SearchResultBoxProps) {
    return (
        <EvmContextProvider>
            <PluginRenderer />
        </EvmContextProvider>
    )
}
