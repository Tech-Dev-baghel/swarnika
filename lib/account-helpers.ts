export { bad, isResponse, json, requireCustomer, str, withStore } from "./api";
export const newIdSafe = () => `adr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
