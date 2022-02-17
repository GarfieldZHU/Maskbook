import { ProviderType } from '@masknet/web3-shared-evm'
import type { Context, Middleware } from '../types'
import { Base } from '../interceptors/Base'
import { MaskWallet } from '../interceptors/MaskWallet'
import { MetaMask } from '../interceptors/MetaMask'
import { WalletConnect } from '../interceptors/WalletConnect'
import { FortmaticProvider } from '../providers/Fortmatic'
import { InjectedProvider } from '../providers/Injected'

export class Interceptor implements Middleware<Context> {
    private interceptors: Partial<Record<ProviderType, Middleware<Context>>> = {
        [ProviderType.MaskWallet]: new MaskWallet(),
        [ProviderType.MetaMask]: new MetaMask(),
        [ProviderType.WalletConnect]: new WalletConnect(),
        [ProviderType.Fortmatic]: new Base(new FortmaticProvider()),
        [ProviderType.Coin98]: new Base(new InjectedProvider()),
        [ProviderType.MathWallet]: new Base(new InjectedProvider()),
        [ProviderType.WalletLink]: new Base(new InjectedProvider()),
    }

    async fn(context: Context, next: () => Promise<void>) {
        this.interceptors[context.providerType]?.fn(context, next)
    }
}
