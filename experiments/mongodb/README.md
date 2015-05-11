
# Simple API Powered By MongoDB And Node.js

by [Ben Nadel][bennadel] (on [Google+][googleplus])

This is an exploration of MongoDB in the context of Node.js. I am attempting to create a
simple API for a simple client-side CRUD (Create, Read, Update, Delete) application. In 
order to keep things simple, I'm using Node.js to power the API and letting the client-
side code (ie, the static files) be served-up by Apache (or what have you).

I'm purposefully avoiding the use of established librareis, like Express and Mongoose, 
since I am trying to understand how Node.js control-flows works. Obviously, many of the 
problems that I will face have already been solved. But, feeling the friction forces me 
to think about why things are wired together the way that they are.

As far as I'm concerned, the only interesting part of the exploration is the API - I 
didn't put much effort or thought into the client-side application.

Want more JavaScript goodness (in general, regardless of Node.js)? Check out 
the [JavaScript blog entries][javascript-blog] on my website.

[bennadel]: http://www.bennadel.com
[googleplus]: https://plus.google.com/108976367067760160494?rel=author
[javascript-blog]: http://www.bennadel.com/blog/tags/6-javascript-dhtml-blog-entries.htm
