import { Observable } from 'rxjs';
import { ActiveState, EntityState, HashMap, ID } from '../api/types';

/** Wraps the provided value in an array, unless the provided _value is an array. */
export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/** Check if a value is an object */
export function isObject(value: any) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function isPlainObject(value) {
  return toBoolean(value) && value.constructor.name === 'Object';
}

export function isFunction(value): value is Function {
  return typeof value === 'function';
}

export function toBoolean(value: any): boolean {
  return value != null && `${value}` !== 'false';
}

export function isUndefined(value) {
  return typeof value === 'undefined';
}

/**
 * Check if entity exists
 */
export function entityExists<E>(id: ID, entities: HashMap<E>) {
  return entities.hasOwnProperty(id);
}

/**
 * Observable that emits empty value and complete
 */
export function noop<T>(): Observable<T> {
  return new Observable(observer => {
    observer.next();
    observer.complete();
  });
}

export function isObservable(value) {
  return toBoolean(value) && isFunction(value.subscribe);
}

export function isString(val: string | any): val is string {
  return typeof val === 'string';
}

export function isNumber(value) {
  return typeof value === 'number';
}

export function isDefined(val) {
  return val !== null && typeof val !== 'undefined';
}

/**
 * Check if the active entity exist
 */
export function resetActive<E>(state: EntityState<E>) {
  return isActiveState(state) && entityExists((state as ActiveState).active, state.entities) === false;
}

/**
 * Check if the store supports active entity
 */
export function isActiveState<E>(state: EntityState<E>) {
  return (state as ActiveState).hasOwnProperty('active');
}

/**
 * setValue(state, 'todos.ui', { filter: {}})
 */
export const setValue = (obj: any, prop: string, val: any) => {
  const split = prop.split('.');

  if (split.length === 1) return val;

  obj = { ...obj };

  const lastIndex = split.length - 2;
  const removeStoreName = prop.split('.').slice(1);

  removeStoreName.reduce((acc, part, index) => {
    if (index === lastIndex) {
      acc[part] = val;
    } else {
      acc[part] = { ...acc[part] };
    }

    return acc && acc[part];
  }, obj);

  return obj;
};

/**
 * getValue(state, 'todos.ui')
 */
export const getValue = (obj: any, prop: string) => {
  /** return the whole state  */
  if (prop.split('.').length === 1) {
    return obj;
  }
  const removeStoreName = prop
    .split('.')
    .slice(1)
    .join('.');
  return removeStoreName.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
};
