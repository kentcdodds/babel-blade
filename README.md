> Welcome! This project is **STILL A WORK IN PROGRESS** and not yet production ready - but I appreciate you trying this out and [giving feedback!](https://twitter.com/swyx)

# Babel-Blade ⛸️

`babel-blade` is the collective name for the babel plugin/macro that helps to generate graphql query strings inline and solves [the double declaration problem](https://babel-blade.netlify.com/docs/declarationdeclaration.html).

Check **[our new Docs site](https://babel-blade.netlify.com/)** or view [the youtube walkthrough](https://www.youtube.com/watch?v=z9wKcRjNqlw) for an explainer!

[![babel blade walkthrough on youtube](https://user-images.githubusercontent.com/6764957/48116756-ef34a800-e21b-11e8-9d4f-049362c25b23.gif)](https://www.youtube.com/watch?v=z9wKcRjNqlw)

# Seriously check out our 👉 [our new Docs site](https://babel-blade.netlify.com/) 👈

Have you heard that we have a **[new Docs site](https://babel-blade.netlify.com/)**? It's in Docusaurus and it's great!

---

## Obligatory Social Proof

> "This is gonna be huge! Colocated graphql queries to the extreme, Completely autogenerated from your code. Super great dev experience & maintainable to the max. 🤗 Use with whatever graphql client framework you want. 🎉 "

<div align="right">
<a href="https://twitter.com/devongovett/status/1018896944977010688">Devon Govett, creator of Parcel</a>
</div>

> "Just took a look at babel-blade. Oh man, does that reverse engineer your gql queries from your usages?????? 👏👏👏"

<div align="right">
<a href="https://twitter.com/AdamRackis/status/1020070216024449027">Adam Rackis, creator of Micrographql-React</a>
</div>

> "Fucking great"

<div align="right">
Ken Wheeler, probably</div>

---

# For developers of plugins/contributors

## boilerplate

This monorepo was bootstrapped from [babel-plugin-macro-boilerplate](https://github.com/sw-yx/babel-plugin-macro-boilerplate). Check it out if you want to make one!

**if you spot something that could be a better practice, PLEASE open an issue or [tell me I'm wrong!](https://twitter.com/swyx)**

---

# For contributors/swyx

## Guide to this repository

This is a monorepo managed by [`lerna`](https://lernajs.io). Let's go through the folder structure:

- `/docs`: source markdown files for our Docusaurus docs
- `/website`: the rest of the files (React, Site config, etc) for our Docusaurus docs
- `/packages/babel.macro`: a very small/insignificant wrapper of `babel-plugin-blade` for hooking into `babel-plugin-macros`. Published as [blade.macro](https://npm.im/blade.macro).
- `/packages/babel-plugin-blade`: the core of this repo, the secret sauce. Published as [babel-plugin-blade](https://npm.im/babel-plugin-blade). It has a separate README, go in there if interested to learn more about its inner workings. If you are just looking to use `babel-plugin-blade` you can just check out **[our new Docs site](https://babel-blade.netlify.com/)**.

## publishing check list

1. `npm run build` on `packages/babel-plugin-blade`
2. `lerna publish`
