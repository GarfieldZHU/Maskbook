import { EthereumMethodType } from '@masknet/web3-shared-evm'
import type { RequestArguments } from 'web3-core'
import { MetaMaskProvider } from '../providers/MetaMask'
import type { Context, Middleware } from '../types'

export class MetaMask implements Middleware<Context> {
    private provider = new MetaMaskProvider()

    async fn(context: Context, next: () => Promise<void>) {
        const request = async (requestArguments: RequestArguments, fallback: string) => {
            try {
                await this.provider.ensureConnectedAndUnlocked()
                context.end(await this.provider.request(requestArguments))
            } catch (error) {
                context.abort(error, fallback)
            }
        }

        switch (context.request.method) {
            case EthereumMethodType.PERSONAL_SIGN:
                try {
                    await this.provider.ensureConnectedAndUnlocked()
                    const [data, address] = context.requestArguments.params as [string, string]
                    context.end(
                        await this.provider.request({
                            method: EthereumMethodType.PERSONAL_SIGN,
                            params: [data, address, ''],
                        }),
                    )
                } catch (error) {
                    context.abort(error, 'Failed to sign data.')
                }
                break
            case EthereumMethodType.ETH_SIGN_TYPED_DATA:
                request(context.requestArguments, 'Failed to sign data.')
                break
            case EthereumMethodType.ETH_SEND_TRANSACTION:
                request(context.requestArguments, 'Failed to send transaction.')
                break
            default:
                await next()
                break
        }
    }
}
