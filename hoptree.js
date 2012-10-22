/*
 * Copyright (c) 2012 University of Washington
 *
 * Dual licensed under the BSD and GPL licenses:
 * - https://github.com/michaelbrooks/hoptree.js/blob/master/BSD-LICENSE.txt
 * - https://github.com/michaelbrooks/hoptree.js/blob/master/GPL-LICENSE.txt
 *
 * More information at http://github.com/michaelbrooks/hoptree
 */

;(function ( $, window, document, undefined ) {

    //Depends on the JavaScript InfoVis Toolkit for rendering the tree.
    var thejit = $jit;
    
    //Methods for modifying the data object that tracks the state of the tree
    var stateMethods = {
        //Shortcut to the setPath method for convenience
        setPath: function(namePath) {
            methods.setPath.call(this.$element, namePath);
        },
        registerName: function(name) {
            var id = this.idIncrement++;
            this.nameToId[name] = id;
            this.idToName[id] = name;
            return id;
        },
        unregisterName: function(name) {
            var id = this.nameToId[name];
            delete this.nameToId[name];
            delete this.idToName[id];
        },
        parsePath: function(pathStr) {
            if (pathStr.charAt(pathStr.length - 1) == '/') {
                pathStr = pathStr.slice(0, -1);
            }
            return pathStr.split("/");
        },
        stringifyPath: function(pathArray) {
            return pathArray.join("/");
        },
        pathChanged: function(pathArray) {
            var self = this;
            pathArray = $.map(pathArray, function(id) { return self.idToName[id]; });
            var path = this.stringifyPath(pathArray);
            
            if (this.options.refocusOnClick) {
                this.setPath(path);
            }
            
            this.options.onPathChange(path, pathArray);
        },
        selectNodes: function(nodeIds, prop) {
            prop = prop || "current";
            var self = this;
            this.st.graph.eachNode(function(node) {
                var id = node.id;
                var label = self.st.labels.getLabel(id);
                var style = label.style;
                if ($.inArray(id, nodeIds) >= 0) {
                    node.data.highlighted = true;
                    node.data.age = 0;

                    node.setData('color', self.options.nodeColor.highlight, prop);
                    node.setLabelData('color', self.options.labelColor.highlight, "current");
                    style.borderColor = self.options.borderColor.highlight;
                    
                    node.eachAdjacency(function(adj) {
                        if (adj.nodeTo.id < id) { //the other node is older, the parent
                            adj.setData('color', self.options.linkColor.highlight, prop);
                            adj.setData('lineWidth', 3, prop);
                        }
                    });
                } else {
                    node.data.highlighted = false;
                    node.data.age++;
                    
                    node.setData('color', self.options.nodeColor.default, prop);
                    node.setLabelData('color', self.options.labelColor.default, "current");
                    
                    style.borderColor = self.options.borderColor.default;
                    node.eachAdjacency(function(adj) {
                        if (adj.nodeTo.id < id) {
                            adj.setData('color', self.options.linkColor.default, prop);
                            adj.setData('lineWidth', 1, prop);
                        }
                    });
                }
            });
        },
        
        animate: function(onComplete) {
            onComplete = onComplete || function() {};
            
            this.st.fx.animate({  
                modes: ['linear',    
                        'edge-property:lineWidth:color',
                        'node-property:color',
                        'label-property:color'],
                duration: 200,
                onComplete: function() {
                    onComplete();
                }
            });
        },
        
        highlightNode: function(name, yes) {
            var self = this;
            
            if (name in this.nameToId) {
                var id = this.nameToId[name];
                var label = this.st.labels.getLabel(id); 
                
                var style = label.style;
                if (yes) {
                    style.borderColor = self.options.borderColor.hover;
                } else {
                    var node = this.st.graph.getNode(id);
                    if (node.data.highlighted) {
                        style.borderColor = self.options.borderColor.highlight;
                    } else {
                        style.borderColor = self.options.borderColor.default;
                    }
                }
            }
        },
        
        createST: function(canvasElement, rootData) {
            var self = this;
            
            //Resize the canvas appropriately
            canvasElement.height(self.options.nodeHeight * self.options.maxLeaves
                + self.options.nodeVerticalSeparation * (self.options.maxLeaves - 1)
                + 2 * self.options.treeMargin);
            
            var canvasWidth = canvasElement.width()
            var canvasHeight = canvasElement.height();
            
            var offsetX = canvasWidth / 2 - self.options.nodeWidth / 2 - self.options.treeMargin;
            var offsetY = canvasHeight / 2 - self.options.nodeHeight / 2 - self.options.treeMargin;
            
            this.st = new thejit.ST({
                //id of viz container element  
                injectInto: canvasElement[0],  
                //set duration for the animation  
                duration: 100,
                //show the whole tree
                constrained: false,
                levelsToShow: self.options.maxDepth,
                //set animation transition type  
                transition: thejit.Trans.Quart.easeInOut,  
                //set distance between node and its children  
                levelDistance:  self.options.nodeHorizontalSeparation,  
                align: "left",
                indent: 0,
                offsetX: offsetX,
                offsetY: offsetY,
                subtreeOffset: 0,
                siblingOffset: self.options.nodeVerticalSeparation,
                //set node and edge styles
                Node: {  
                    height: self.options.nodeHeight,  
                    width: self.options.nodeWidth,
                    type: 'rectangle',  
                    color: self.options.nodeColor.default,  
                    overridable: true,
                },  
                  
                Edge: {  
                    type: 'bezier',
                    color: self.options.linkColor.default,
                    overridable: true  
                },
                
                //This method is called on DOM label creation.  
                //Use this method to add event handlers and styles to  
                //your node.  
                onCreateLabel: function(label, node){
                    label.id = node.id;              
                    label.innerHTML = node.name;
                    label.onclick = function(){  
                        if (!self.options.isBusy()) {
                            self.counts.nav++;
                            var pathArray = self.pathsByNode[node.id];
                            self.pathChanged(pathArray);
                        }
                    };
                    $(label).hover(function() {
                        if (!self.options.isBusy()) {
                            self.highlightNode(node.name, true);
                            self.options.onMouseEnter(node.name, true);
                        }
                    }, function() {
                        if (!self.options.isBusy()) {
                            self.highlightNode(node.name, false);
                            self.options.onMouseLeave(node.name, false);
                        }
                    });
                    
                    //set label styles - check if this does anything
                    var style = label.style;
                    style.whiteSpace = "nowrap";
                    style.overflow = "hidden";
                    style.textOverflow = "ellipsis";
                    
                    style.padding = "2px";
                    style.width = (self.options.nodeWidth-8) + 'px';
                    style.height = (self.options.nodeHeight-8) + 'px';              
                    style.lineHeight = (self.options.nodeHeight-8) + "px";
                    
                    style.cursor = 'pointer';  
                    style.color = self.options.labelColor.default;  
                    
                    style.fontSize = '1em';  
                    style.textAlign= 'center';  
                    
                    style.borderWidth = 2 + "px";
                    style.borderColor = self.options.borderColor.default;
                    style.borderStyle = "solid";
                },
            });
            
            this.st.loadJSON(rootData);
            
            this.st.select(this.st.root);
            this.selectNodes([this.st.root]);
            
            this.st.plot();
        }
    };
    
    //Externally accessible methods
    var methods = {
        init: function( options ) {
            options = $.extend( true, {}, $.fn.hoptree.options, options );
            
            if (options.breadcrumb) {
                options.maxLeaves = 1;
            }
            
            var data = {
                counts: {
                    nav: 0
                },
                leaves: [],
                pathsByNode: {},
                idIncrement: 0,
                idToName: {},
                nameToId: {},
                options: options,
                $element: this
            };
            $.extend(data, stateMethods);
            
            var rootData = {
                id: data.registerName(options.rootName),
                name: options.rootName,
                children: []
            };
            
            data.leaves.push(rootData.id);
            data.pathsByNode[rootData.id] = [rootData.id];
            
            data.createST(this, rootData);
            
            this.data("hoptree", data);
        },
        
        /**
         * Call this to set the path that the history tree shows.
         * The tree will update appropriately.
         * Does not call onPathChange.
         */
        setPath: function(namePath) {
            if (this.length != 1) {
                $.error("Only one hoptree at a time for now");
                return;
            }
            
            var data = this.data("hoptree");
            if (typeof data == "undefined") {
                $.error("Hoptree not initialized");
                return;
            }
            
            //split up the path into pieces
            if (typeof namePath == "string") {
                namePath = data.parsePath(namePath);
                if (namePath.length < 1) {
                    $.error("Empty path");
                    return; //empty path?
                }
            }
            
            //If it doesn't start with the root (name) it's no good
            if (namePath[0] != data.idToName[data.st.root]) {
                $.error("illegal root:" + namePath[0]);
                return;
            }
            
            //convert names to ids for the rest of this function
            var path = []
            for (var i = 0; i < namePath.length; i++) {
                var id;
                if (namePath[i] in data.nameToId) {
                    id = data.nameToId[namePath[i]];
                } else {
                    id = data.registerName(namePath[i]);
                }
                path.push(id);
            }
            
            //We'll check to see if we need to add or remove nodes
            var subtreeToAdd = null;
            var idToRemove = null;
            
            //Check that the end is not already present in the tree (no changes)
            if (!data.st.graph.hasNode(path[path.length - 1])) {
            
                //Build the subtree for the new path
                var currentLevel = subtreeToAdd;
                var leafInserted = false;
                //Iterate over the path
                for (var pathIdx = 0; pathIdx < path.length; pathIdx++) {
                    var pathElement = path[pathIdx];
                    //Record the path for this node, just so it is easier to remember later
                    data.pathsByNode[pathElement] = path.slice(0, pathIdx + 1);
                    
                    var node = {
                        id: pathElement,
                        name: namePath[pathIdx],
                        children: []
                    }
                    
                    //If subtreeToAdd is null, this is the root element (special case)
                    if (subtreeToAdd == null) {
                        subtreeToAdd = node;
                        currentLevel = subtreeToAdd;
                    } else {
                        //normal case
                        currentLevel.children.push(node);
                        currentLevel = node;
                    }
                    
                    //Check if we are replacing an existing leaf
                    if (!leafInserted) {
                        var leafToReplace = data.leaves.indexOf(pathElement);
                        if (leafToReplace >= 0) {
                            //remove the existing leaf and replace at the end
                            data.leaves.splice(leafToReplace, 1);
                            data.leaves.push(path[path.length - 1]);
                            leafInserted = true;
                        }
                    }
                }
                //if we didn't replace a leaf yet, just add it
                if (!leafInserted) {
                    data.leaves.push(path[path.length - 1]);
                    leafInserted = true;
                }
                
                //And then if we have too many leaves, remove...
                if (data.leaves.length > data.options.maxLeaves) {
                
                    //Remove the oldest leaf and unneeded parents
                    var oldLeaf = data.leaves.shift();
                    
                    //prevNode is the one we'll actually be removing
                    var prevNode = null;
                    var oldNode = data.st.graph.getNode(oldLeaf);
                    var children = oldNode.getSubnodes([1,1]);
                    
                    //while there are no subtrees worth saving in children
                    while (children.length <= 1) {
                        //but we don't want to remove an element that is in the new path
                        if ($.inArray(oldNode.id, path) >= 0) {
                            break;
                        }
                    
                        prevNode = oldNode; //we've just decided to kill oldNode, so advance prevNode
                        data.unregisterName(prevNode.name);
                        
                        //look ahead
                        oldNode = oldNode.getParents()[0];
                        children = oldNode.getSubnodes([1,1]);
                    }
                    
                    //now remove prevNode, because oldNode has children we want to keep
                    idToRemove = prevNode.id;
                }
            } else if (data.options.breadcrumb) {
                var leaf = data.st.graph.getNode(path[path.length - 1]);
                var children = leaf.getSubnodes([1,1]);
                if (children.length > 0) {
                    idToRemove = children[0].id;
                }
                
                data.unregisterName(children[0].name);
                data.leaves[0] = path[path.length - 1];
            }
            
            //Now actually remove the subtree
            if (idToRemove) {
                var nodeToRemove = data.st.graph.getNode(idToRemove);
                nodeToRemove.setDataset('end', {
                    alpha: 0
                });
                data.st.fx.animate( {
                    modes: ['linear', 'node-property:alpha'],
                    onComplete: function() {
                        data.st.removeSubtree(idToRemove, true, "animate", {
                            hideLabels: false,
                            onComplete: function() {
                                if (subtreeToAdd) {
                                    data.st.addSubtree(subtreeToAdd, "animate", {
                                        hideLabels: false,
                                        onComplete: function() {
                                            data.selectNodes(path, "end");
                                            data.animate();
                                        }
                                    });
                                } else if (data.options.breadcrumb) {
                                    data.selectNodes(path, "end");
                                    data.animate();
                                }
                            }
                        });
                    }
                });
            } else {
            //And actually add the subtree
                if (subtreeToAdd) {
                    data.st.addSubtree(subtreeToAdd, "animate", {
                        hideLabels: false,
                        onComplete: function() {
                            data.selectNodes(path, "end");
                            data.animate();
                        }
                    });
                } else {
                    data.selectNodes(path, "end");
                    data.animate();
                }
            }
        }
    };

    //Initialize the plugin
    $.fn.hoptree = function ( method ) {    
        // Method calling logic
        if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.hoptree' );
        }
    }
    
    //Set the default options
    $.fn.hoptree.options = {
        nodeColor : {
            default: "#FFF",
            highlight: "#FFF"
        },
        labelColor: {
            default: "#23A4FF",
            highlight: "#23A4FF"
        },
        linkColor: {
            default: "#BBB",
            highlight: "#888"
        },
        borderColor: {
            default: "#BBB",
            highlight: "#888",
            hover: "#F7941D"
        },
        nodeWidth: 130,
        nodeHeight: 22,
        nodeHorizontalSeparation: 30,
        nodeVerticalSeparation: 8,
        maxDepth: 5,
        treeMargin: 10,
        maxLeaves: 3,
        breadcrumb: false,
        refocusOnClick: true,
        
        //Override these
        rootName: "Root",
        onPathChange: $.noop,
        onMouseEnter: $.noop, 
        onMouseLeave: $.noop,
        isBusy: $.noop
    };
})( jQuery, window, document );
