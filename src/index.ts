import { encode, decode } from "doge-don";
import { cacheFn } from "ps-std";

export const noop = () => {};

export const localStorage =
	"localStorage" in globalThis
		? globalThis.localStorage
		: {
				values: new Map<string, any>(),
				getItem(key: string) {
					return this.values.get(key);
				},
				setItem(key: string, value: any) {
					return this.values.set(key, value);
				},
		  };

export interface Store<T> {
	value: T;
	set(value: T): void;
	update(_callback: (_value: T) => T): void;
	subscribe(_callback: (_value: T) => void): () => void;
}

export const store = cacheFn(<T>(key: string): Store<T> => {
	let value: T = decode(localStorage.getItem(key) || "");

	const subscribers = new Set<(_value: T) => void>();

	const set = (new_value: T) => {
		if (value !== new_value) {
			localStorage.setItem(key, encode((value = new_value)));

			for (const subscriber of subscribers) {
				Promise.resolve(subscriber(new_value)).catch(noop);
			}
		}
	};

	const subscribe = (callback: (_value: T) => void) => {
		subscribers.add(callback);

		return () => subscribers.delete(callback);
	};

	const update = (callback: (_value: T) => T) => {
		set(callback(value));
	};

	const store = {
		get value() {
			return value;
		},
		set value(new_value) {
			store.set(new_value);
		},
		set,
		subscribe,
		update,
	};

	return store;
});

export const state = new Proxy({} as Record<string, Store<any>>, {
	get(_target, key) {
		return store(String(key));
	},
	set(_target, key, value) {
		store(String(key)).set(value);

		return true;
	},
});
