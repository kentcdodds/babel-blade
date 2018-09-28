---
title: Array Methods
author: swyx
authorURL: http://twitter.com/swyx
authorImageURL: https://pbs.twimg.com/profile_images/990728399873232896/CMPn3IxT_400x400.jpg
---

so to handle array prototypes i theoretically need to go and reimplement [the entire Array.prototype](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype) spec. however i just dont have time for that right now and it is likely not going to be that useful. so what i can do is have an Ignore list and a special Enabled List where I manually make sure that the blade is passed through to the internal inline function.

The ignore list i am working with is:

```js
const arrayPrototypeIgnores = [
  "length",
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "unshift",
  "sort",
  "splice",
  "concat",
  "includes",
  "indexOf",
  "join",
  "lastIndexOf",
  "slice",
  "toSource",
  "toString",
  "toLocaleString",
  "entries",
  "every",
  "filter",
  "find",
  "findIndex",
  "forEach",
  "keys",
  "map",
  "reduce",
  "reduceRight",
  "some",
  "values"
];
```

and I will just work on enabling `map` as it will probably be a good example for the rest.

---

the first observation i make is that the array prototype method problem is a RHS one so i can just zoom in on that part of the code.

once an array prototype method is used, the LHS is no longer useful to us so i need to also block that LHS parsing.

---

## hasHitArrayMethod

I ended up implementing using a dirty flag:

```js
refs.forEach(ref => {
  let [newRef, newSemanticPath, hasHitArrayMethod] = TraceRHS(
    ref,
    semanticPath,
    semanticVisitor
  );
  if (!hasHitArrayMethod) TraceLHS(newRef, newSemanticPath, semanticVisitor);
});
```

and then inside RHS:

```js
function TraceRHS(ref, semanticPath, semanticVisitor) {
  let ptr = ref;
  let newSemanticPath = [...semanticPath];
  let hasHitArrayMethod = false;

  while (isValidRHSParent(ptr)) {
    ptr = ptr.parentPath;
    workOnRHSParent(ptr, newSemanticPath, semanticVisitor);
  }
  return [ptr, newSemanticPath, hasHitArrayMethod];

  // hoisted up
  function isValidRHSParent(ptr) {
    const baseLayer = ["Member", "Call"]
      .map(x => x + "Expression")
      .includes(ptr.parentPath.type);
    const validGrandParent =
      ptr.parentPath.parentPath.type != "ExpressionStatement";
    return baseLayer && validGrandParent && !hasHitArrayMethod;
  }

  // hoisted up
  function workOnRHSParent(ptr, newSemanticPath, semanticVisitor) {
    if (ptr.type === "MemberExpression") {
      const newPath = ptr.node.property.name;
      if (arrayPrototypeIgnores.includes(newPath)) {
        hasHitArrayMethod = true;
        if (
          arrayPrototypeEnables[newPath] &&
          isValidArrayPrototypeInternal(ptr)
        ) {
          const internalFunctionIndex = arrayPrototypeEnables[newPath];
          const internalFunction = ptr.parentPath.get("arguments")[0]; // arrow fn
          const paramRef = internalFunction.get("params")[
            internalFunctionIndex - 1
          ]; // 1-indexed param just to make it null checkable
          semanticTrace(
            paramRef,
            paramRef.get("name").node,
            semanticVisitor,
            newSemanticPath
          );
        }
      } else {
        newSemanticPath.push(newPath);
        const parent = ptr.parentPath;
        conditionalCall(
          semanticVisitor,
          parent.type,
          "RHS",
          parent,
          newSemanticPath
        );
      }
    }

    // will be hoisting up
    function isValidArrayPrototypeInternal(ptr) {
      const isValidParent = ptr.parentPath.type === "CallExpression";
      const isArrowChild =
        ptr.parentPath.get("arguments")[0].type === "ArrowFunctionExpression";
      return isValidParent && isArrowChild;
    }
  }
}
```

so LHS gets short circuited as does RHS post an array method call.

current state: https://latest.astexplorer.net/#/gist/01983f61e310f1eaf6b12a221556a937/adec3bd3874c7c28df5f648bea71733ee52b37ef

---

## final prep before integrating babel-blade

now we clean up all the console logs, and do some manipulation to see what happens.

ok that was a success.. heres a simple replacement:

```js
const semanticVisitor = {
  default(...args) {
    console.log("[debugging callback]", ...args);
  },
  CallExpression(...args) {
    const [hand, ref, semPath, ...rest] = args;
    const callee = ref.get("callee");
    console.log("CallExpression", hand, semPath, ref, callee);
    ref.replaceWith(callee);
  },
  VariableDeclarator(...args) {
    console.log("VariableDeclarator", ...args);
  },
  ArrowFunctionExpression(...args) {
    console.log("ArrowFunctionExpression", ...args);
  }
};
```

it turns `abc.foo('@test','poo').foo1` into `abc.foo.foo1`.

now i have to integrate the rest of the thingy.

https://latest.astexplorer.net/#/gist/01983f61e310f1eaf6b12a221556a937/4ec4d2ebbcbaca04be21435930a1b4dddd2421f7

---

ok that was tricky but wasnt too bad. i have a working reconstituted babel-blade!

inside of `handleCreateRazor` i now use:

```js
refs.forEach(razor => {
  // define visitor
  const semanticVisitor = {
    default(...args) {
      console.log("[debugging callback]", ...args);
    },
    CallExpression(...args) {
      const [hand, ref, semPath, ...rest] = args;
      const callee = ref.get("callee");
      console.log("CallExpression", hand, semPath, ref, callee);
      ref.replaceWith(callee);
    },
    MemberExpression(...args) {
      const [hand, ref, semPath, ...rest] = args;
      console.log("MemberExpression", hand, semPath, ref);
      let currentRazor = razorData;
      semPath.forEach(chunk => {
        currentRazor = currentRazor.add({ name: chunk });
      });
    },
    VariableDeclarator(...args) {
      console.log("VariableDeclarator", ...args);
    },
    ArrowFunctionExpression(...args) {
      console.log("ArrowFunctionExpression", ...args);
    }
  };
  // go through all razors
  if (isCallee(razor)) {
    // we have been activated! time to make a blade!
    razorID = getAssignTarget(razor);
    // clear the reference
    if (razor.container.arguments[0])
      razor.parentPath.replaceWith(razor.container.arguments[0]);
    else razor.parentPath.remove();
    // parseBlade(razor, razorID, razorData)
    semanticTrace(razor, razorID, semanticVisitor);
  }
});
```

phew. https://latest.astexplorer.net/#/gist/01983f61e310f1eaf6b12a221556a937/213eda76de287dffef1fb899596e8c89262fa422

now this does the basic macro example:

```js
import { Connect, query } from "urql";
import { createQuery } from "blade.macro";

const movieQuery = createQuery("$id: id");
const Movie = ({ id, onClose }) => (
  <div>
    <Connect
      query={query(movieQuery, { id: id })}
      children={({ data }) => {
        const DATA = movieQuery(data);
        return (
          <div>
            <h2>{DATA.movie.gorilla}</h2>
            <p>{DATA.movie.monkey}</p>
            <p>{DATA.chimp}</p>
          </div>
        );
      }}
    />
  </div>
);
```

and produces

```js
import { Connect, query } from "urql";

const Movie = ({ id, onClose }) => (
  <div>
    <Connect
      query={query(
        `
query movieQuery($id: id){
  movie {
    gorilla
    monkey
  }
  chimp
}`,
        {
          id: id
        }
      )}
      children={({ data }) => {
        const DATA = data;
        return (
          <div>
            <h2>{DATA.movie.gorilla}</h2>
            <p>{DATA.movie.monkey}</p>
            <p>{DATA.chimp}</p>
          </div>
        );
      }}
    />
  </div>
);
```