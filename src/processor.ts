import { ERC20Processor } from '@sentio/sdk/eth/builtin'
import { getERC20Contract } from '@sentio/sdk/eth/builtin/erc20'
import { getPriceByType,  getPriceBySymbol, token } from "@sentio/sdk/utils"
import { BigDecimal, Counter, Gauge, MetricOptions } from "@sentio/sdk"
import { EthChainId } from "@sentio/sdk/eth"

import {
    TokenBoughtEvent,
    TokenCreatedEvent,
    TokenSoldEvent,
    ConfiPumpRouterContext,
    ConfiPumpRouterProcessor,
} from './types/eth/confipumprouter.js'

const startBlock = 111249995 // ~Dec 9 2024


ConfiPumpRouterProcessor.bind({
        address: "0x4B892680CAf3B6D63E0281bF1858D92d0A7ba90b",
        network: EthChainId.CONFLUX,
        startBlock: startBlock
    }).onEventTokenBought(async (event: TokenBoughtEvent, ctx: ConfiPumpRouterContext) => {
        const tokenInfo = await token.getERC20TokenInfo(ctx, event.args.token)

        ctx.meter.Counter("cumulative_buys").add(1)
        ctx.meter.Counter("circulating").add(
            event.args.amount.scaleDown(tokenInfo.decimal),
            {
                token: event.args.token,
                tokenSymbol: tokenInfo.symbol,
                distinctId: event.args.buyer
            })
        ctx.eventLogger.emit("Buy", {
            token: event.args.token,
            tokenSymbol: tokenInfo.symbol,
            tokenName: tokenInfo.name,
            distinctId: event.args.buyer,
            amount: event.args.amount.scaleDown(tokenInfo.decimal),
            eth: event.args.eth.scaleDown(tokenInfo.decimal),
            fee: event.args.fee.scaleDown(tokenInfo.decimal),
            postPrice: event.args.postPrice
        })
    }).onEventTokenSold(async (event: TokenSoldEvent, ctx: ConfiPumpRouterContext) => {
        const tokenInfo = await token.getERC20TokenInfo(ctx, event.args.token)

        ctx.meter.Counter("cumulative_sells").add(1)
        ctx.meter.Counter("circulating").sub(
            event.args.amount.scaleDown(tokenInfo.decimal),
            {
                token: event.args.token,
                tokenSymbol: tokenInfo.symbol,
                distinctId: event.args.seller
            })
        ctx.eventLogger.emit("Sell", {
            token: event.args.token,
            tokenSymbol: tokenInfo.symbol,
            tokenName: tokenInfo.name,
            distinctId: event.args.seller,
            amount: event.args.amount.scaleDown(tokenInfo.decimal),
            eth: event.args.eth.scaleDown(tokenInfo.decimal),
            fee: event.args.fee.scaleDown(tokenInfo.decimal),
            postPrice: event.args.postPrice
        })
    }).onEventTokenCreated(async (event: TokenCreatedEvent, ctx: ConfiPumpRouterContext) => {
        const tokenInfo = await token.getERC20TokenInfo(ctx, event.args.token)

        ctx.meter.Counter("cumulative_created").add(1)
        ctx.eventLogger.emit("Created", {
            token: event.args.token,
            tokenSymbol: tokenInfo.symbol,
            tokenName: tokenInfo.name,
            distinctId: event.args.creator,
        })
    })