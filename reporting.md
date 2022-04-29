## Reporting bugs
The Bots works well for most usages, but it sometimes still has bugs.

When finding one it's best to report an issue providing these information :

* what you want to do (the objective in english)
* what you tried (the code)
* what happened
* what you expected to happen

### Error handling
In most cases, mineflayer shouldn't crash the bot. Even if something fails, the bot can take an alternative route to get to its objective.

What that means is we shouldn't use `throw(new Error("error"))` but instead use the node.js convention of passing the error in the callback.

For example : 

```js
function myfunction (param1, callback) {
  // do stuff
  let toDo = 1
  toDo = 2
  if (toDo === 2) { // everything worked
    callback()
  } else {
    callback(new Error('something failed'))
  }
}
```
### Updating the documentation
The table of content of docs/api.md is made with doctoc. After updating that file, you should run doctoc docs/api.md to update the table of content.
