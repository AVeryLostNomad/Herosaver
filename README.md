# Herosaver-Chibify

Based on the original Herosaver and the [fork by notnullgames](https://notnullgames.github.io/Herosaver/), this version has been modified to work with chibify. It might eventually also support heroforge, but I have no plans to go back to it at the moment.

This tool is explicitly to explore the inner workings of these character creators, and should not be used for anything other than educational purposes.

## Usage

```
npm install
npm start
```

Navigate to [chibify.com](https://www.chibify.com/) and open your console, paste the following:

```
g = u => fetch(u || 'http://localhost:1234/herosaver.js').then(r => r.text()).then(eval)

// get STL
g().then(() => saveGLTF())
```
