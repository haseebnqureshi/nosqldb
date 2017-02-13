Beautifully straight forward NoSQL JSON document DB.

# NoSQL DB

![npm monthly downloads](https://img.shields.io/npm/dm/nosqldb.svg)
![github release](https://img.shields.io/github/release/haseebnqureshi/nosqldb.svg)
![github license](https://img.shields.io/github/license/haseebnqureshi/nosqldb.svg)

### npm install nosqldb --save

### Background
This project came from wanting the flexibility in a NoSQL DB syntax, but without the bloat of having an extra database service starting in the background. Sometimes, you just want to store JSON data in a local file, and have intuitive methods that help you store and retrive that data. This's exactly what NoSQL DB does.

### Getting Started
Super straightforward. Here are the few steps:
1. Bring NoSQL DB into your project with ```npm install nosqldb --save```
2. Create any new data collection with ```var users = require('nosqldb')('users')```
3. Run your node app. That's it!

### API 
With each new data collection, you get a series of helpers that easily get your data in and out from local storage.

#### all()
Takes no parameters, simply returns all rows in your collection.

#### saveItem(item)
Takes an item object, where keys and values are defined. This object will be appended to your collection.

#### saveItems(item, item2, item3 ...)
Takes unlimited item objects as parameters, where each item's keys and values are defined. Each item is consecutively appended to your collection.

#### makeEmpty()
Takes no parameters, removes all rows and empties your collection.

#### where(predicate)
Takes a predicate, where keys and values are defined. Only rows matching all keys and values in your predicate will be returned.

#### findWhere(predicate)
Takes a predicate, where keys and values are defined. Only the first row matching all keys and values in your predicate will be returned.

#### deleteWhere(predicate)
Takes a predicate, where keys and values are defined. Only rows matching all keys and values in your predicate will be removed from your collection.

#### keepWhere(predicate)
Takes a predicate, where keys and values are defined. Only rows matching all keys and values in your predicate will be saved in your collection. All other rows will be removed from your collection.

#### updateWhere(predicate, updatedValues)
Takes a predicate and updatedValues, where each has keys and values defined. Only rows matching all keys and values in your predicate will be updated in your collection.

### Primary Key
By default, the primary key is simply ```id``` and NoSQL DB auto-generates that identifier for each row (or JSON document). Alternatively, you have the option of overriding the auto-generated identifier. Simply pass your own value for the ```id``` parameter in any document save or update method.

### Document Hashing
By default, NoSQL DB auto-generates that identifier as a unique hash to that object. That means NoSQL DB maintains unique records for you, right out-the-box. Alternatively, you have the option of overriding this feature. Simply pass the string ```'nonunique'``` for the ```id``` parameter in any document save method. This gets you non-unique records in your collection anytime.

### Quick Notes
Currently, there's no chaining of methods. Also, you can't use any RegEx in your predicates. These are features that I'll be adding going forward, that is if people are wanting those features. 

Also, this modules relies on Node's native fs module. So don't try running this in the browser or in any environment where Node's native fs module doesn't work. Again I'd love to add a browser port, maybe using Google's Level but only if people are wanting that in this project ;)

Happy coding!
HQ

