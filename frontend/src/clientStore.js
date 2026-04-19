import { reactive, readonly } from "vue";

/**
 * Централизованное реактивное состояние клиента (Vue 3 reactive).
 * Источник правды по данным по-прежнему localStorage; здесь — снимок для UI и отчёта.
 */
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
