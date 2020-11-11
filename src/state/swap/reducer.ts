import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const ETH = 'ETH'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly canHedge: boolean
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: ''
  },
  [Field.OUTPUT]: {
    currencyId: ''
  },
  recipient: null,
  canHedge: false
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId } }) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId
          },
          independentField: field,
          typedValue: typedValue,
          recipient,
          // Eric's code to check if the output is a WETH or ETH
          canHedge: outputCurrencyId === WETH || outputCurrencyId === ETH
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      // Eric's code to check if the output is a WETH or ETH
      let canHedge = false
      if (
        ((currencyId === WETH || currencyId === ETH) && field === Field.OUTPUT) ||
        state[Field.OUTPUT].currencyId === WETH ||
        state[Field.OUTPUT].currencyId === ETH
      ) {
        console.log('selectCurrency')
        console.log(currencyId)
        canHedge = true
      }

      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId: currencyId },
          [otherField]: { currencyId: state[field].currencyId },
          canHedge
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId: currencyId },
          canHedge
        }
      }
    })
    .addCase(switchCurrencies, state => {
      // Eric's code to check if the output on the toggle/switch is a WETH or ETH
      let canHedge = false
      if (state[Field.INPUT].currencyId === WETH || state[Field.INPUT].currencyId === ETH) {
        console.log('switchCurrencies')
        console.log(state[Field.INPUT].currencyId)
        canHedge = true
      }

      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
        canHedge
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
