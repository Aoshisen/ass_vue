import { trackEffects, triggerEffects, isTracking } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";

class RefImpl {
  private _value: any;
  public dep;
  public __v_isRef=true;
  private _rawValue: any;

  constructor(value) {
    // 1.看看value是不是对象，如果不是直接返回，如果是那么就处理包裹一下
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    //这里需要收集依赖
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    //这里需要触发依赖
    //如果对比的话那么对象
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isRef(value){
  return !!value.__v_isRef
}

export function unRef(ref){
  return isRef(ref)?ref.value:ref;
}

export function ref(value) {
  return new RefImpl(value);
}
