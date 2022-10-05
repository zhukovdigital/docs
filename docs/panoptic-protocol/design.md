---
sidebar_position: 2
---

# Protocol Design
What are the key ideas behind Panoptic.

## Manipulation Protections
Many flash-loan based attacks involve the borrowing of a large amount of fund (sometimes at zero cost!) with the goal of manipulate the price of an asset or token balance in a smart contract.
Impartantly, flash-loan attacks require all funds to be paid back in the same block.

The Panoptic Protocol aims to prevent pool manipulation attacks by prevent funds to be withdrawn in the same block they were deposited.
Similarly, delegating funds to an account locks both the `delegator` and `delegatee` accounts for that particular block.


## Computed quantities 
Several computed quantities are derived from the token balance in the Panoptic and Uniswap v3 pools.

### Total Balance
The totalBalance() value is the amount of tokens that 1) can be sold and moved to the Uniswap v3 pool or 2) have already moved to the Uniswap v3 pool.
This balance is computed using the total token balance inside the Panoptic pool, obtained by calling `IERC20(token0).balanceOf(panopticPool)`, the amount of tokens moved into the Uniswap v3 pool and the amount of token collected.

This derived quantity is used to compute the collateral shares.

```solidity
>pp = IPanopticPool
>univ3pool = IUniswapV3Pool
>token0 = ERC20 interface of collateral token                                | tolen0.balanceOf(pp) =
                                                                          _--| amount of token0 owned
                                                                         /   | by the Panoptic Pool
    _----------------pp.totalBalance()---------------_                  /
   /                                                  \                /
  |   _----pp.inAMM0()---_     _--------------token0.balanceOf(pp)---------------_
  |  /                    \   /                        |  _---pp.collected0()--_  \
  | |  amount of token0    | |  amount of `free` token | /                      \  |
  | |  moved from Panoptic | |   that can be withdrawn ||   collected token0,    | |
  | |   to UniswapV3       | |   or used to sell       ||    reserved to be      | |
  | |                      | |   undercollateralized   | \    paid to sellers   /  |
  |  \                    /   \     options            |  ¯--------------------¯  /
  |   ¯------------------¯     ¯-----------------------+-------------------------¯
   \                                                  /
    ¯------------------------------------------------¯

```

### Pool Utilization
The pool utilization is a measure of the fraction of the `totalBalance()` which belongs to the Uniswap v3 pool.
This parameter is compute whenever a position is minted to set the collateralization ratio and commission rate of the position (calculations shown below).



```solidity
poolUtilization = pp.inAMM0() / pp.totalBalance();
                = pp.inAMM0() / (pp.inAMM0() + `free` token0)
                = pp.inAMM0() / (pp.inAMM0)) + token0.balanceOf(pp) - pp.collected())



-Example 1: poolUtilization = 50%  (targeted equilibrium)
   _------pp.totalBalance()--+-------------------------_
  /                          |                          \   COMMISSION_RATE       = 20bps
 |     pp.inAMM0()           |     `free` token0         |  BUY_COLLATERAL_RATIO  = 10%
  \                          |                          /   SELL_COLLATERAL_RATIO = 20%
   ¯-------------------------+-------------------------¯



-Example 2: poolUtilization = 90% (favors buying)
   _------pp.totalBalance()---------------------+------_
  /                                             |       \   COMMISSION_RATE       = 20bps
 |                    pp.inAMM0()               | fT0    |  BUY_COLLATERAL_RATIO  = 5%
  \                                             |       /   SELL_COLLATERAL_RATIO = 100%
   ¯--------------------------------------------+------¯



-Example 3: poolUtilization = 10% (favors selling)
   _-----+-----pp.totalBalance()-----------------------_
  /      |                                              \   COMMISSION_RATE       = 60bps
 | inAMM0|            `free` token0                      |  BUY_COLLATERAL_RATIO  = 10%
  \      |                                              /   SELL_COLLATERAL_RATIO = 20%
   ¯-----+---------------------------------------------¯

```


## Commission and Collateral Requirements

The commission and the collateralization ratios are computed *after* all funds have moved in/out of the Panoptic pool.


### Commission Fees

The commission rate is computed from the pool utilization and is paid whenever an option is minted.
The value of the commission to be paid is the `notional value` of the options multiplied by the commission rate.

The comission decreases to 20bps at >50% pool utilization and linearly increases to 60bps for pool utilization below 10%.

```solidity
COMMISSION
_RATE         ^
              |  max commission = 60bps
     60bps  _ |_____
              |    .¯¯---__
              |    .       ¯¯---__        min commission = 20bps
     20bps  _ |    .              ¯¯---____________________________
              |    .                   .                        .
              +----+-------------------+------------------------+--->   POOL_UTILIZATION
                  10%                 50%                      100%

```


### Collateralization ratio (buying)

The collateralization ratio for buying an option is set at a fixed 10% for pool utilization less than 50% and decrease to 5% at 90% or more.


```solidity

BUY
_COLLATERAL
_RATIO        ^
              |   max ratio = 10%
        10% _ |_________________________
              |                         ¯¯---__
              |                        .       ¯¯---__          min ratio = 5%
        5%  - |                        .              ¯¯---________
              |                        .                   .    .
              +------------------------+-------------------+----+--->   POOL_UTILIZATION
                                      50%                 90%   100%

```


### Collateralization ratio (selling)

The collateralization ratio for buying an option is set at a fixed 20% for pool utilization less than 50% and increases to 100% at 90% or more.

```solidity

SELL
_COLLATERAL
_RATIO        ^                                            max ratio = 100%
       100% - |                                            _________
              |                                       __-¯¯.    .
              |                                  __-¯¯     .    .
              |  min ratio = 20%            __-¯¯          .    .
        20% _ |_________________________--¯¯               .    .
              |                        .                   .    .
              +------------------------+-------------------+----+--->   POOL_UTILIZATION
                                    50%                   90%   100%

```

### Buying Power Requirement (buying)

The buying power requirement for buying an option is simply: `BPR = BUY_COLLATERAL_RATIO * NOTIONAL_VALUE + ACCUMULATED_LONG_PREMIUM`

### Buying Power Requirement (selling)

The buying power requirement (BPR) for selling an option is :


BPR for puts (with collateral denominated in numeraire):

```solidity
                                        .
BUYING                                  .
_POWER                         <- ITM   .  OTM ->
_REQUIREMENT                            .
              ^                         .
       100% - |-__    BPR = 100% - (100% - SCR)*(price/strike)
              |   ¯¯--__                .
              |         ¯¯--__          .
              |               ¯¯--__    .            min BRP = SELL_COLLATERAL_RATIO
        SCR - |                     ¯¯--________________________________
              |                         .
              +-------------------------+--------------------------->   current price
              0                      strike

```

BPR for calls (with collateral denominated in numeraire):

```solidity

BUYING                     .                                              __-- >100%
_POWER                     .                                        __--¯¯
_REQUIREMENT       <- OTM  .  ITM ->                          __--¯¯
              ^            .                            __--¯¯
       100% - |  -   -   - . -   -   -   -   -   -__--¯¯  -   -   -   -   -   - 100%
              |            .                __--¯¯  .
              |            .          __--¯¯        .
              | min BRP    .    __--¯¯       BPR = SCR + (100% - SCR)*(price/strike - 1)
 SELL_RATIO _ |_____________--¯¯                    .
              |            .                        .
              +------------+------------------------+--------------->   current price
              0         strike                 2 * strike

```

The buying power requirement of a call can exceed the notional value of the minted option.
However, users can deposit the asset as collateral in order to mitigate those risks.



BPR for calls (with collateral denominated in asset):
```solidity

BUYING                     .
_POWER                     .
_REQUIREMENT       <- OTM  .  ITM ->
              ^            .
       100% - |  -   -   - . -   -   -   -   -   -   -   -   -   -___----- 100%
              |            .               ______-------¯¯¯¯¯¯¯¯¯¯
              |            .   ___----¯¯¯¯¯
              | min BRP    . --      BPR = 100% - (100% - SCR)*(strike/price)
 SELL_RATIO _ |_____________¯
              |            .
              +------------+---------------------------------------->   current price
              0         strike

```


# Liquidation and forced exercise costs.

### Liquidation Bonus

```solidity

LIQUIDATION
_BONUS        ^  max bonus = 100%
       100% _ |___________
              |          .¯-_
              |          .   ¯-_                   no cost at 100% capitalization
              |          .      ¯-_             /
              |          .         ¯-_        /
              |          .            ¯-_  /
         0% - +----------+---------------+---------------+---------->    MIN_CAPITAL_REQUIREMENT
              |        50%            100% ¯-_         150%
              |                               ¯-_        .
              |                                  ¯-_     .
              |                                     ¯-_  .     min bonus = -100%
      -100% - |                                        ¯-_______________
              |
```

### Force exercise cost

```solidity

EXERCISE
_COST         ^   max cost = 10.24%
 60+1024bps _ |____
  60+512bps _ |    |____
  60+256bps _ |    .    |____
  60+128bps _ |    .    .    |____
   60+64bps _ |    .    .    .    |____
   60+32bps _ |    .    .    .    .    |____
   60+16bps _ |    .    .    .    .    .    |____
    60+8bps _ |    .    .    .    .    .    .    |____
    60+4bps _ |    .    .    .    .    .    .    .    |____
    60+2bps _ |    .    .    .    .    .    .    .    .    |____    min cost = 0.01%
    60+1bps _ |    .    .    .    .    .    .    .    .    .    |____
              +----+----+----+----+----+----+----+----+----+----+--->
                  1x   2x   3x   4x   5x   6x   7x   8x   9x  10x    DISTANCE_FROM_STRIKE
                                                                      (number of "widths")

```

