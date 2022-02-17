import { escapeRegExp, isNull } from 'lodash-unified'
import { ChainId, NonFungibleAssetProvider, formatBalance } from '@masknet/web3-shared-evm'
import { EVM_RPC } from '../../EVM/messages'
import Services from '../../../extension/service'
import { getOrderUnitPrice, NonFungibleTokenAPI } from '@masknet/web3-providers'
import { ZERO } from '@masknet/web3-shared-base'
import BigNumber from 'bignumber.js'

function getLastSalePrice(lastSale?: NonFungibleTokenAPI.AssetEvent | null) {
    if (!lastSale?.total_price || !lastSale?.payment_token?.decimals) return
    return formatBalance(lastSale.total_price, lastSale.payment_token.decimals)
}

export async function getNFT(address: string, tokenId: string) {
    const asset = await EVM_RPC.getAsset({
        address,
        tokenId,
        chainId: ChainId.Mainnet,
        provider: NonFungibleAssetProvider.OPENSEA,
    })
    const amount =
        getOrderUnitPrice(
            asset?.desktopOrder?.current_price,
            asset?.desktopOrder?.payment_token_contract?.decimals ?? 0,
            asset?.desktopOrder?.quantity ?? '1',
        ) ??
        getLastSalePrice(asset?.last_sale) ??
        ZERO
    return {
        amount: new BigNumber(amount).toFixed(),
        name: asset?.name ?? '',
        symbol: asset?.desktopOrder?.payment_token_contract?.symbol ?? 'ETH',
        image: asset?.image_url ?? '',
        owner: asset?.top_ownerships[0].owner.address ?? '',
        slug: asset?.slug ?? '',
    }
}

export async function createNFT(address: string, tokenId: string) {
    return EVM_RPC.getNFT({ address, tokenId, chainId: ChainId.Mainnet, provider: NonFungibleAssetProvider.OPENSEA })
}

export async function getImage(image: string): Promise<string> {
    const blob = await Services.Helper.fetch(image)
    return (await blobToBase64(blob)) as string
}

function blobToBase64(blob: Blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
    })
}

export function toPNG(image: string) {
    return new Promise<Blob | null>((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (isNull(ctx)) throw new Error('Canvas was not supported')
        img.addEventListener('load', () => {
            ;[canvas.width, canvas.height] = [img.width, img.height]
            ctx.drawImage(img, 0, 0, img.width, img.height)
            canvas.toBlob((blob) => {
                resolve(blob)
            }, 'image/png')
        })
        img.addEventListener('error', () => {
            reject(new Error('Could not load image'))
        })
        img.setAttribute('CrossOrigin', 'Anonymous')
        img.src = image
    })
}

export function formatPrice(amount: string, symbol: string) {
    const _amount = new BigNumber(amount ?? '0')
    if (_amount.isZero()) return ''
    if (_amount.isLessThan(1)) return `${_amount.toFixed(2)} ${symbol}`
    if (_amount.isLessThan(1e3)) return `${_amount.toFixed(1)} ${symbol}`
    if (_amount.isLessThan(1e6)) return `${_amount.div(1e6).toFixed(1)}K ${symbol}`
    return `${_amount.div(1e6).toFixed(1)}M ${symbol}`
}

export function formatText(name: string, tokenId: string) {
    const _name = name.replace(/#\d*/, '').trim()
    let token = tokenId
    if (tokenId.length > 10) {
        token = tokenId.slice(0, 6) + '...' + tokenId.slice(-4)
    }
    return `${_name} #${token}`
}

export function getScriptURL(content: string, name: string) {
    const matchURL = new RegExp(
        `${escapeRegExp(`https://abs.twimg.com/responsive-web/client-web/${name}.`)}\\w+${escapeRegExp('.js')}`,
        'm',
    )
    const [url] = content.match(matchURL) ?? []
    return url
}

export function getScriptContentMatched(content: string, regexp: RegExp) {
    const [, matched] = content.match(regexp) ?? []
    return matched
}

export function getCSRFToken() {
    const ct0 = document.cookie.split('; ').find((x) => x.includes('ct0'))
    if (!ct0) return ''
    const [, value] = ct0.split('=')
    return value
}

export * from './userNFTContainerAtTwitter'
