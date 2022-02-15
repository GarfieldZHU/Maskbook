import type { RequestOptions, SendOverrides } from '@masknet/web3-shared-evm'
import type { RequestArguments } from 'web3-core'
import type { JsonRpcResponse } from 'web3-core-helpers'
import { getError, hasError } from './error'
import type { Context, Middleware } from './types'

class Composer<T> {
    private middlewares: Middleware<T>[] = []

    private compose() {
        return (context: T, next: () => Promise<void>) => {
            let index = -1
            const dispatch = (i: number): Promise<void> => {
                if (i <= index) return Promise.reject(new Error('next() called multiple times'))
                index = i
                let fn
                if (i >= this.middlewares.length) fn = next
                else fn = this.middlewares[i].fn.bind(this.middlewares[i])
                if (!fn) return Promise.resolve()
                try {
                    return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
                } catch (err) {
                    return Promise.reject(err)
                }
            }

            return dispatch(0)
        }
    }

    public use(middleware: Middleware<T>) {
        this.middlewares.push(middleware)
    }

    public async dispatch(context: T, next: () => Promise<void>) {
        await this.compose()(context, next)
    }
}

let pid = 0

class RequestContext implements Context {
    private id = pid++
    private writeable = true
    private rawError: Error | null = null
    private rawResult: unknown
    private callbacks: ((error: Error | null, response?: JsonRpcResponse) => void)[] = []

    constructor(
        private rawRequestArguments: RequestArguments,
        private rawOverrides?: SendOverrides,
        private rawOptions?: RequestOptions,
    ) {}

    get requestArguments() {
        return this.rawRequestArguments
    }

    get request() {
        return {
            id: this.id,
            jsonrpc: '2.0',
            params: [],
            ...this.requestArguments,
        }
    }

    get response() {
        if (this.writeable) return
        return {
            id: this.id,
            jsonrpc: '2.0',
            result: this.rawResult,
        }
    }

    get error() {
        if (this.writeable) return null
        if (hasError(this.rawError, this.response))
            return getError(this.rawError, this.response, 'Failed to send request.')
        return null
    }

    set error(error: Error | null) {
        this.rawError = error
    }

    get result() {
        return this.rawResult
    }

    set result(result: unknown) {
        this.rawResult = result
    }

    get sendOverrides() {
        return this.rawOverrides
    }

    get requestOptions() {
        return this.rawOptions
    }

    write(error: Error | null, result?: unknown) {
        if (!this.writeable) return
        this.writeable = false
        this.error = error
        this.result = result
        this.callbacks.forEach((x) => x(this.error, this.response))
    }

    onResponse(callback: (error: Error | null, response?: JsonRpcResponse) => void) {
        if (!this.callbacks.includes(callback)) this.callbacks.push(callback)
    }
}

const composer = new Composer<Context>()

export function use(middleware: Middleware<Context>) {
    return composer.use(middleware)
}

export function dispatch(context: Context, next: () => Promise<void>) {
    return composer.dispatch(context, next)
}

export function createContext(requestArguments: RequestArguments, overrides?: SendOverrides, options?: RequestOptions) {
    return new RequestContext(requestArguments, overrides, options)
}
