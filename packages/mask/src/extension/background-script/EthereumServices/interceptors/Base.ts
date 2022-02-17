import { EthereumMethodType } from '@masknet/web3-shared-evm'
import type { Context, Middleware, Provider } from '../types'

export class Base implements Middleware<Context> {
    constructor(private provider: Provider) {}

    async fn(context: Context, next: () => Promise<void>) {
        switch (context.request.method) {
            case EthereumMethodType.PERSONAL_SIGN:
            case EthereumMethodType.ETH_SIGN_TYPED_DATA:
            case EthereumMethodType.ETH_SEND_TRANSACTION:
                try {
                    context.end(await this.provider.request(context.request))
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
