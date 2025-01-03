const origin = {}
const obj = new Proxy(origin, {
  get: function (target, propKey, receiver) {
		return '10'
  }
});

obj.a // 10
obj.b // 10
origin.a // undefined
origin.b // undefined
console.log(obj.a) // 10