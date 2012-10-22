Hoptree.js
============

Hoptree.js is a jQuery plugin that creates a "hoptree", a widget that makes browsing hierarchical structures easier by displaying a branching history. Hoptrees are used in a similar way to breadcrumbs.

Where to use it
---------------

Hoptree.js is appropriate for use on highly interactive websites with dynamic content that is hierarchical in nature. Examples would be web-based tree visualization tools and code repositories or other online file system browsers.

In general, the hoptree widget should be used when your users need to navigate through a large hierarchy where your page will provide a primary view of the hierarchical content. The hoptree should be positioned so as to offer another means of navigating through the hierarchy, just like a breadcrumb, an address bar, or a navigation menu.

How does it work
----------------

At all times, the hoptree widget displays a subset of the full hierarchy. When a user visits a node in the hierarchy, the hoptree widget updates to include the path from the root of the hierarchy to that node. If too many branches are being displayed, the hoptree prunes older branches from its display.

This makes it easy for users to move between several locations in the tree, which might be useful if they are checking for differences between several nodes. Additionally, by depicting the structure of the hierarchy, hoptrees, like breadcrumbs, help users understand the structure they are exploring, which also leads to easier navigation.

How to use it
-------------

Currently, hoptree.js depends on [jQuery](http://jquery.com) and the [JavaScript InfoVis Toolkit](http://thejit.org/).

To install hoptree.js, include the following tags in your page header:

```html
<script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="jit.js"></script>
<script type="text/javascript" src="hoptree.js"></script>
```

Hoptrees need to be updated when the user navigates in your hierarchy. Users also need to be able to trigger navigation through the hoptree widget itself.

First we do half of the work, initializing the hoptree plugin:

```javascript
var theNameOfTheRootOfYourTree = "root";

$('#hoptree').hoptree({
    rootName: theNameOfTheRootOfYourTree,
    onPathChange: function(path) {
        //A function that gets called when the user 
        //clicks on a node in the hoptree. This should update
        //the main view of the hierarchy on your page.
    }
});

```

You must set the name of the root of your tree when you initialize the hoptree, so that it can be rendered. Unless you want to have a really boring hoptree, you'll need to write a callback function that adjusts the main view of the hierarchy. The `path` parameter will be a string representation of the user's new path, delimited by slashes: `"root/path/to/something"`.

Next, we need to notify the hoptree widget if the user navigates by an action external to the hoptree:

```javascript
$('#hoptree').hoptree("setPath", path);
```

We called the setPath method on the hoptree, providing a new slash-delimited path string to the current location.

Examples
--------

You can see a hoptree in action in the [Gender Browser](http://www.eigenfactor.org/gender), an information visualization about gender in scholarly authorship from Eigenfactor.org.

Known limitations
-----------------

- All node names in the hierarchy must currently be globally unique. This requirement will be removed soon.

License
-------

Copyright (c) 2012 University of Washington

This software is currently dual-licensed under the modified ("3-clause") BSD license and the GPL version 3.0.

Contributors
------------

- [Michael Brooks](http://students.washington.edu/mjbrooks)
- [Jevin D. West](http://leonia.zoology.washington.edu/people/jevin)
- [Cecilia R. Aragon](http://faculty.washington.edu/aragon)
- [Carl T. Bergstrom](http://octavia.zoology.washington.edu)
