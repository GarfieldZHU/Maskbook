import type { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { first } from 'lodash-unified'
import WalletConnect from '@walletconnect/client'
import type { IJsonRpcRequest } from '@walletconnect/types'
import { ProviderType, ChainId } from '@masknet/web3-shared-evm'
import { resetAccount, updateAccount } from '../../../../plugins/Wallet/services'
import { currentProviderSettings } from '../../../../plugins/Wallet/settings'
import { BaseProvider } from './Base'
import type { Provider } from '../types'

export class WalletConnectProvider extends BaseProvider implements Provider {
    private connector: WalletConnect | null = null

    public async signPersonalMessage(data: string, address: string, password: string) {
        if (!this.connector) throw new Error('Connection Lost.')
        return (await this.connector.signPersonalMessage([data, address, password])) as string
    }

    public async sendCustomRequest(payload: JsonRpcPayload) {
        if (!this.connector) throw new Error('Connection Lost.')
        return (await this.connector.sendCustomRequest(payload as IJsonRpcRequest)) as JsonRpcResponse
    }

    public async signTypedDataMessage(data: string, address: string) {
        if (!this.connector) throw new Error('Connection Lost.')
        return (await this.connector.signTypedData([data, address])) as string
    }

    /**
     * Create a new connector and destroy the previous one if exists
     */
    async createConnector() {
        if (this.connector?.connected) return this.connector

        // create a new connector
        this.connector = new WalletConnect({
            bridge: 'https://uniswap.bridge.walletconnect.org',
            clientMeta: {
                name: 'Mask Network',
                description: 'Mask Network',
                url: 'https://mask.io',
                icons: ['https://mask.io/apple-touch-icon.png'],
            },
        })
        this.connector.on('connect', this.onConnect)
        this.connector.on('session_update', this.onUpdate)
        this.connector.on('disconnect', this.onDisconnect)
        this.connector.on('error', this.onDisconnect)
        if (!this.connector.connected) await this.connector.createSession()
        return this.connector
    }

    async createConnectorIfNeeded() {
        if (this.connector) return this.connector
        return this.createConnector()
    }

    private onConnect() {
        this.onUpdate(null)
    }

    private async onUpdate(
        error: Error | null,
        payload?: {
            params: {
                chainId: number
                accounts: string[]
            }[]
        },
    ) {
        if (error) return
        if (!this.connector?.accounts.length) return
        if (currentProviderSettings.value !== ProviderType.WalletConnect) return
        await updateAccount({
            name: this.connector.peerMeta?.name,
            account: first(this.connector.accounts),
            chainId: this.connector.chainId,
            providerType: ProviderType.WalletConnect,
        })
    }

    private async onDisconnect(error: Error | null) {
        if (this.connector?.connected) await this.connector.killSession()
        this.connector = null
        if (currentProviderSettings.value !== ProviderType.WalletConnect) return
        await resetAccount({
            providerType: ProviderType.WalletConnect,
        })
    }

    async requestAccounts() {
        const connector = await this.createConnectorIfNeeded()
        return new Promise<{ accounts: string[]; chainId: ChainId }>(async (resolve, reject) => {
            function resolve_() {
                resolve({
                    accounts: connector.accounts,
                    chainId: connector.chainId,
                })
            }
            if (connector.accounts.length) {
                resolve_()
                return
            }
            connector.on('connect', resolve_)
            connector.on('update', resolve_)
            connector.on('error', reject)
        })
    }
}
