import { EthereumMethodType } from '@masknet/web3-shared-evm'
import { WalletConnectProvider } from '../providers/WalletConnect'
import type { Context, Middleware } from '../types'

export class WalletConnect implements Middleware<Context> {
    private provider = new WalletConnectProvider()

    async fn(context: Context, next: () => Promise<void>) {
        switch (context.request.method) {
            case EthereumMethodType.PERSONAL_SIGN:
                try {
                    const [data, address] = context.request.params as [string, string]
                    context.end(await this.provider.signPersonalMessage(data, address, ''))
                } catch (error) {
                    context.abort(error, 'Failed to sign data.')
                }
                break
            case EthereumMethodType.ETH_SIGN_TYPED_DATA:
                try {
                    const [address, data] = context.request.params as [string, string]
                    context.end(await this.provider.signTypedDataMessage(data, address))
                } catch (error) {
                    context.abort(error, 'Failed to sign data.')
                }
                break
            case EthereumMethodType.ETH_SEND_TRANSACTION:
                try {
                    context.end(await this.provider.sendCustomRequest(context.request))
                } catch (error) {
                    context.abort(error, 'Failed to send transaction.')
                }
                break
            default:
                await next()
                break
        }
    }
}
