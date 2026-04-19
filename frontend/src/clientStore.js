import { reactive, readonly } from "vue";

export const clientState = reactive({
  isLoggedIn: false,
  cartQuantity: 0,
  cartTotalRub: 0,
  cartTotalFormatted: "0 ₽",
});

export const clientStateReadonly = readonly(clientState);

export function patchClientState(partial) {
  Object.assign(clientState, partial);
}
