import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: [],
  },
  reducers: {
    addToCart(state, action) {
      const { product, quantity } = action.payload;
      const existing = state.cart.find((item) => item.product.id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.cart.push({ product, quantity })
      }
    },
    removeCart(state, action) {
      state.cart = state.cart.filter((item) => item.product.id !== action.payload.id)
    },
    updateCartQuantity(state , action){
       const item = state.cart.find((item)=>{
          item.product.id === action.payload.id
       })
       if (item) {
         item.quantity += action.payload.quantity
       }
    },
    clearCart(state){
       state.cart= []
    },
  }
});

export const {addToCart , removeCart , updateCartQuantity , clearCart } = cartSlice.actions;

export default cartSlice.reducer;
