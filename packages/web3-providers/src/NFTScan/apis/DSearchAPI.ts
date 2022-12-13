import type {
    NonFungibleCollectionResult,
    NonFungibleTokenResult,
    SearchResult,
    SourceType,
} from '@masknet/web3-shared-base'
import urlcat from 'urlcat'
import { fetchCached } from '../../entry-helpers.js'
import { fetchJSON } from '../../helpers/fetchJSON.js'
import type { DSearchBaseAPI } from '../../types/DSearch.js'

export interface FungibleToken {
    id: string | number
    name: string
    symbol: string
    sourceType: SourceType
}

export interface NonFungibleToken {
    address: string
    name: string
    chain: string
}

const BASE_URL = 'https://raw.githubusercontent.com/DimensionDev/Mask-Search-List/master/'

export class NFTScanSearchAPI<ChainId, SchemaType> implements DSearchBaseAPI.DataSourceProvider<ChainId, SchemaType> {
    async get(): Promise<Array<SearchResult<ChainId, SchemaType>>> {
        const nftsURL = urlcat(BASE_URL, '/output/non-fungible-tokens/nftscan.json')
        const collectionsURL = urlcat(BASE_URL, '/output/non-fungible-collections/nftscan.json')
        const nfts = fetchJSON<Array<NonFungibleTokenResult<ChainId, SchemaType>>>(nftsURL, undefined, fetchCached)
        const collections = fetchJSON<Array<NonFungibleCollectionResult<ChainId, SchemaType>>>(
            collectionsURL,
            undefined,
            fetchCached,
        )

        return (await Promise.allSettled([nfts, collections]))
            .map((v) => (v.status === 'fulfilled' && v.value ? v.value : []))
            .flat()
    }
}