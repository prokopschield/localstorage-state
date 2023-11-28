import { encode, decode } from "doge-don";
import { cacheFn } from "ps-std";
import { Writable, writable } from "svelte/store";

export const store = cacheFn(<T>(key: string) => {
	let value: T = decode(localStorage.getItem(key) || "");
	const store = writable<T>(value);

	store.subscribe((new_value: T) => {
		localStorage.setItem(key, encode((value = new_value)));
	});

	return {
		...store,
		get value() {
			return value;
		},
		set value(new_value) {
			store.set(new_value);
		},
	};
});

export const state = new Proxy(
	{} as Record<string, Writable<any> & { value: any }>,
	{
		get(_target, key) {
			return store(String(key));
		},
		set(_target, key, value) {
			store(String(key)).set(value);

			return true;
		},
	}
);
