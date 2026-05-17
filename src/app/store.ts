import { configureStore } from '@reduxjs/toolkit'
import { samplerReducer } from '../features/sampler/dataSlice'

export const store = configureStore({
  reducer: {
    sampler: samplerReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
