//code by shaderbytes//

function SketchfabAPIUtility(urlIDRef, iframeRef, callbackRef, clientInitObjectRef) {
    var classScope = this;
    this.api;
    this.client;
    this.clientInitObject = { };//if you want any default init options hard coded just add them here
    if (clientInitObjectRef != null) {
        for (var prop in clientInitObjectRef) {       
            classScope.clientInitObject[prop] = clientInitObjectRef[prop];
          
        }
    }
    this.isInitialized = false;
    this.iframe = iframeRef;
    this.urlID = urlIDRef;
    this.materialHash = {};
    //node hash stores matrix transform nodes by name
    this.nodeHash = {};
    

    this.nodeTypeMatrixtransform = "MatrixTransform";
    this.nodeTypeCurrent = classScope.nodeTypeMatrixtransform;
    this.nodeTypeGeometry = "Geometry";
    this.nodeTypeGroup = "Group";
    this.nodeTypeRigGeometry = "RigGeometry";

    classScope.nodeHash[classScope.nodeTypeMatrixtransform] = {};
    classScope.nodeHash[classScope.nodeTypeGeometry] = {};
    classScope.nodeHash[classScope.nodeTypeGroup] = {};
    classScope.nodeHash[classScope.nodeTypeRigGeometry] = {};

    this.nodeHashIDMap = {};
    this.eventListeners = {};
    this.nodesRaw;  
    this.enableDebugLogging = true;
    this.callback = callbackRef;
    //materialChannelProperties
    this.AOPBR = "AOPBR";
    this.AlbedoPBR = "AlbedoPBR";
    this.BumpMap = "BumpMap";
    this.CavityPBR = "CavityPBR";
    this.DiffuseColor = "DiffuseColor";
    this.DiffuseIntensity = "DiffuseIntensity";
    this.DiffusePBR = "DiffusePBR";
    this.EmitColor = "EmitColor";
    this.GlossinessPBR = "GlossinessPBR";
    this.MetalnessPBR = "MetalnessPBR";
    this.NormalMap = "NormalMap";
    this.Opacity = "Opacity";
    this.RoughnessPBR = "RoughnessPBR";
    this.SpecularColor = "SpecularColor";
    this.SpecularF0 = "SpecularF0";
    this.SpecularHardness = "SpecularHardness";
    this.SpecularPBR = "SpecularPBR";
    this.NormalMap = "NormalMap";

    this.vectorForward = [0, -1, 0];
    this.vectorBackward = [0, 1, 0];
    this.vectorLeft = [-1,0, 0];
    this.vectorRight = [1, 0, 0];
    this.vectorUp = [0, 0, 1];
    this.vectorDown = [0, 0, -1];

    this.textureLoadingCount = 0;
    this.gamma = 2.4;
    this.textureLoadedCallback;

    this.annotations = [];
    this.animationClips = {};
    this.annotationLength = 0;
    this.animationClipsLength = 0;
    this.currentAnnotationIndex = -1;
    this.currentAnnotationObject = {};

    this.currentAnimationObject = {};

    this.animationTimerIntervalID;
    this.playAnimationClipOnceOnly = false;

    //preprocessflags
    this.materialPreprocessCompleted = false;
    this.nodePreprocessCompleted = false;
    this.annotationPreprocessCompleted = false;
    this.animationPreprocessCompleted = false;

    this.create = function () {
       
        classScope.client = new Sketchfab('1.0.0', classScope.iframe);

        classScope.clientInitObject.success = classScope.onClientInit;
        classScope.clientInitObject.error = classScope.onClientError;

        classScope.client.init(classScope.urlID, classScope.clientInitObject);
    };
    this.onClientError = function () {
        console.error('a call to "init()" on the sketchfab client object has failed');
    };


    this.onClientInit = function (apiRef) {
       
        classScope.api = apiRef;      
        classScope.api.addEventListener('viewerready', classScope.onViewerReady);
        classScope.api.start();
    };

    this.onViewerReady = function () {
       
        //prepare data for ease of use

        //for each call into the api that gets used for preprocesing a flag should be created which can be validated to decide that the 
        //utility has finished all preprocessing       
        classScope.api.getMaterialList(classScope.generateMaterialHash);
        classScope.api.getNodeMap(classScope.generateNodeHash);       
        classScope.api.getAnnotationList(classScope.generateAnnotationControls);
        classScope.api.getAnimations(classScope.generateAnimationControls);
        //possible other calls here ...

       

    };

   

    this.validateUtilGenerationPreprocess = function () {

        //validate all used preprocess flags
        if (classScope.materialPreprocessCompleted && classScope.nodePreprocessCompleted && classScope.annotationPreprocessCompleted && classScope.animationPreprocessCompleted) {
            classScope.isInitialized = true;
            classScope.callback();
        }
    }

    this.generateAnimationControls = function (err, animations) {
        if (err) {
            console.log('Error when calling getAnimations');
            return;
        };
        if (classScope.enableDebugLogging) {
            console.log("animation listing");
            console.log(animations);
        }

        for (var i = 0; i < animations.length; i++) {

            var ob = classScope.animationClips[animations[i][1]] = {};
            ob.name = animations[i][1]
            ob.uid = animations[i][0];
            ob.length = animations[i][2];
           
        };       
        classScope.animationClipsLength = animations.length;

        classScope.animationPreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    }

    this.getAnimationObject = function (key) {
        var dataObjectRef = classScope.animationClips[key];
        if (dataObjectRef == null) {
            console.error('a call to  getAnimationObject using key/name ' + key + ' has failed , no such object found');
            return null;
        }
        return dataObjectRef;
    }
   
   

    this.generateMaterialHash = function (err, materials) {
        if (err) {
            console.log('Error when calling getMaterialList');
            return;
        };
        if (classScope.enableDebugLogging) {
            console.log("materials listing");
            
        }
        for (var i = 0; i < materials.length; i++) {
           
            classScope.materialHash[materials[i].name] = materials[i];
            if (classScope.enableDebugLogging) {
                console.log("name: " + materials[i].name);
            }
        };
        classScope.materialPreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    }

    this.addEventListener = function(event,func){
        if (classScope.eventListeners[event] == null) {
            classScope.eventListeners[event] = [];
            if (event == "click") {
                if (classScope.isInitialized) {
                    classScope.api.addEventListener("click", classScope.onClick);
                } else {
                    console.log("a call to add a click event listener has been rejected because this utility has not completed initialization");
                    return;
                }
            }
        }
        classScope.eventListeners[event].push(func);
    }

    this.removeEventListener = function (event, func) {
        if (classScope.eventListeners[event] != null) {
            for (var i = classScope.eventListeners[event].length-1; i >= 0; i--) {
                if (classScope.eventListeners[event][i] == func) {
                    classScope.eventListeners[event][i].splice(i, 1);
                }
            }
            if (classScope.eventListeners[event].length == 0) {
                classScope.eventListeners[event] = null;
                if (event == "click") {
                    classScope.api.removeEventListener("click", classScope.onClick);
                }
            }

        }
    }


    this.onClick = function (e) {
      
        var node = classScope.getNodeObject(e.instanceID);
        e.node = node;
        for (var i = 0; i < classScope.eventListeners["click"].length; i++) {
            classScope.eventListeners["click"][i](e);
        }
    }
    
   

    this.generateNodeHash = function (err, nodes) {
       
        if (err) {
            console.log('Error when calling getNodeMap');
            return;
        };
        classScope.nodesRaw = nodes;
       

        var currentNodeName = "";
        var currentNodeGroup = "";
        var a = [classScope.nodeTypeMatrixtransform, classScope.nodeTypeGeometry, classScope.nodeTypeGroup, classScope.nodeTypeRigGeometry];
       
        for (var prop in nodes) {
            var node = nodes[prop];            
           
            if (node.name != undefined) {
                if ((node.name.toLowerCase().indexOf(".fbx") != -1) || (node.name.toLowerCase().indexOf("rootmodel") != -1) || (node.name.toLowerCase().indexOf("rootnode") != -1) || (node.name.toLowerCase().indexOf("polygonnode") != -1)) {
                    continue;
                }
              
                for (var k = 0; k < a.length; k++) {
                    if (node.type != a[k]) {
                        continue
                    }
                    ;
                    classScope.nodeTypeCurrent = a[k];
                   
                    var n = classScope.nodeHash[classScope.nodeTypeCurrent];
                   
                    if (node.type == classScope.nodeTypeGeometry || node.type == classScope.nodeTypeRigGeometry) {
                        classScope.nodeHashIDMap[node.instanceID] = classScope.nodeHash[currentNodeGroup][currentNodeName];
                                           
                        break;
                    }

                    
                    if (node.children.length == 0) {
                       
                        break;
                    }
                    
                    
                    currentNodeName = node.name;
                    currentNodeGroup = classScope.nodeTypeCurrent;
                    node.isVisible = true;
                   
                    if (n[node.name] != null) {
                        //so now we have nodes with the same name and need to convert this storage into an array or push into that array
                        if (!Array.isArray(n[node.name])) {

                            var nodeTemp = n[node.name];
                            n[node.name] = null;
                            n[node.name] = [];
                            n[node.name].push(nodeTemp);
                            n[node.name].push(node);
                            classScope.nodeHashIDMap[node.instanceID] = n[currentNodeName];

                        } else {
                            n[node.name].push(node);
                            classScope.nodeHashIDMap[node.instanceID] =n[currentNodeName];
                        }

                    } else {
                        n[node.name] = node;
                        classScope.nodeHashIDMap[node.instanceID] = n[currentNodeName];
                    }
                   

                }
            }
        };

        if (classScope.enableDebugLogging) {
            for (var k = 0; k < a.length; k++) {
                console.log(" ");
                console.log("nodes listing " + a[k]);
                var n = classScope.nodeHash[a[k]];
                for (var key in n) {
                    if (Array.isArray(n[key])) {
                        console.log("multiple nodes with same name ,use name and index to reference a single instance, if no index is passed in conjunction with this name, all nodes with this name would be affected: ")
                        for (var i = 0; i < n[key].length; i++) {
                            console.log("name: " + n[key][i].name + " index: " + i);
                        }
                    } else {
                        console.log("unique node name, use only name to retrieve: ");
                        console.log("name: " + n[key].name);
                    }
                }
            }
           
        }

        classScope.nodePreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    }

   



    this.generateAnnotationControls = function (err, annotations) {
        if (err) {
            console.log('Error when calling getAnnotationList');
            return;
        };
        if (classScope.enableDebugLogging) {
            console.log("annotations listing");
            console.log(annotations);
        }

        classScope.annotations = annotations;
        classScope.annotationLength = annotations.length;
        for (var i = 0; i < annotations.length; i++) {
            classScope.annotations[i].description = classScope.annotations[i].content.raw || "";
        }

        classScope.annotationPreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    }

    this.gotoNextAnnotation = function () {
        if (classScope.annotationLength == 0) return;
        classScope.currentAnnotationIndex++;
        if (classScope.currentAnnotationIndex >= classScope.annotationLength) {
            classScope.currentAnnotationIndex = 0;
        }
        classScope.currentAnnotationObject = classScope.annotations[classScope.currentAnnotationIndex];
        classScope.api.gotoAnnotation(classScope.currentAnnotationIndex);
    }

    this.gotoPreviousAnnotation = function () {
        if (classScope.annotationLength == 0) return;
        classScope.currentAnnotationIndex--;
        if (classScope.currentAnnotationIndex < 0) {
            classScope.currentAnnotationIndex = classScope.annotationLength - 1;
        }
        classScope.currentAnnotationObject = classScope.annotations[classScope.currentAnnotationIndex];
        classScope.api.gotoAnnotation(classScope.currentAnnotationIndex);
    }

    this.gotoAnnotation = function (index) {
        if (classScope.annotationLength == 0) return;
        if (isNaN(index)) {
            console.error("A call to gotoAnnotation requires you pass in a number for the index");
            return;
        }

        //cap the ranges incase they are out of bounds
        if (index >= classScope.annotationLength) {
            index = classScope.annotationLength - 1;
        } else if (index < 0) {
            index = 0;
        }
        classScope.currentAnnotationIndex = index;
        classScope.currentAnnotationObject = classScope.annotations[classScope.currentAnnotationIndex];
        classScope.api.gotoAnnotation(classScope.currentAnnotationIndex);

    }
    // key can be a name or an instance id. Also remember instance id's of geometry nodes are mapped to their relevant root matrix transform node
    this.getNodeObject = function (key, nodeIndex, currentNodeType) {
     
        var dataObjectRef;
        classScope.nodeTypeCurrent = currentNodeType || classScope.nodeTypeMatrixtransform;
        
        if (typeof key === 'string' || key instanceof String) {            
            dataObjectRef = classScope.nodeHash[classScope.nodeTypeCurrent][key];
         
        } else {
            dataObjectRef = classScope.nodeHashIDMap[key];
        }
                
       
        if (dataObjectRef == null) {
            console.error('a call to  getNodeObject using ' + currentNodeType + ' list id and using node name ' + key + ' has failed , no such node found');
            return null;
        }

        if (nodeIndex != null) {
            if (Array.isArray(dataObjectRef)) {
                if (nodeIndex < 0 || nodeIndex >= dataObjectRef.length) {
                    console.error('a call to  getNodeObject using node name ' + key + ' has failed , the nodeIndex is out of range. You can pass an array index ranging : 0 - ' + (dataObjectRef.length - 1));
                    return;
                } else {
                    dataObjectRef = dataObjectRef[nodeIndex];
                }
            }
        }

        // take note the returned object could be a direct reference to the node object if it is unique , or it returns an array of node objects if they share the same name
        //or it could be a direct refrence to the node object within the array if you passed in a nodeIndex and the name is mapped to an array
        
        return dataObjectRef;
    }

    this.lookat = function (key, direction,distance, duration, callback) {
        var dataObjectRef = classScope.getNodeObject(key,null,classScope.nodeTypeMatrixtransform);
        
        var dataObjectRefSingle;
        if (dataObjectRef != null) {
            if (direction == null) {
                direction = classScope.vectorForward;
            }
            if (distance == null) {
                distance = 10;
            }
            if (Array.isArray(dataObjectRef)) {
                console.log("multiple nodes returned during call to lookat, first node will be used");
                dataObjectRefSingle = dataObjectRef[0];
            } else {
                dataObjectRefSingle = dataObjectRef;
            }

           
            var target = [dataObjectRefSingle.worldMatrix[12], dataObjectRefSingle.worldMatrix[13], dataObjectRefSingle.worldMatrix[14]];
            var eye = [target[0] + (direction[0] * distance), target[1] + (direction[1] * distance), target[2] +( direction[2] * distance)];
            classScope.api.setCameraLookAt(eye, target, duration, callback);

        }
    }

    this.combineVectorDirections = function () {
        var directionCombined = [0,0,0];
        for (i = 0; i < arguments.length; i++) {
            directionCombined[0] += arguments[i][0];
            directionCombined[1] += arguments[i][1];
            directionCombined[2] += arguments[i][2];
        }
        return directionCombined;
    }

    this.translate = function (key, direction,distance, duration, easing, callback) {

        var dataObjectRef = classScope.getNodeObject(key, null, classScope.nodeTypeMatrixtransform);
        var dataObjectRefSingle;
        if (dataObjectRef != null) {
            if (direction == null) {
                direction = classScope.vectorForward;
            }
            if (distance == null) {
                distance = 1;
            }
            if (Array.isArray(dataObjectRef)) {
                console.log("multiple nodes returned during call to lookat, first node will be used");
                dataObjectRefSingle = dataObjectRef[0];
            } else {
                dataObjectRefSingle = dataObjectRef;
            }
            if (dataObjectRefSingle.worldMatrixisCached = undefined) {
                dataObjectRefSingle.worldMatrixisCached = true;
                dataObjectRefSingle.worldMatrixCached = dataObjectRefSingle.worldMatrix;
            
            }
           
            var currentPosition = [dataObjectRefSingle.worldMatrix[12], dataObjectRefSingle.worldMatrix[13], dataObjectRefSingle.worldMatrix[14]];
            var newPosition = [currentPosition[0] + (direction[0] * distance), currentPosition[1] + (direction[1] * distance), currentPosition[2] + (direction[2] * distance)];
            //write new position back into matrix
            dataObjectRefSingle.worldMatrix[12] = newPosition[0];
            dataObjectRefSingle.worldMatrix[13] = newPosition[1];
            dataObjectRefSingle.worldMatrix[14] = newPosition[2];
            classScope.api.translate(dataObjectRef.instanceID, newPosition, duration,easing, callback);

        }

    }


    this.setNodeVisibility = function (key, makeVisible, nodeIndex, currentNodeType) {
        var useTogglebehaviour = false;
        if (makeVisible == null) {
            useTogglebehaviour = true;
        }
        var dataObjectRef = classScope.getNodeObject(key, null, currentNodeType);
        var dataObjectRefSingle;
        var loopArray = false;
        if (dataObjectRef != null) {

            if (Array.isArray(dataObjectRef)) {
                if (nodeIndex == null) {
                    loopArray = true;
                    dataObjectRefSingle = dataObjectRef[0];
                } else if (nodeIndex < 0 || nodeIndex >= dataObjectRef.length) {
                    console.error('a call to  setNodeVisibility using node name ' + key + ' has failed , this name is mapped to multiple objects and requires you to pass an array index ranging : 0 - ' + (dataObjectRef.length - 1));
                    return;
                } else {
                    dataObjectRefSingle = dataObjectRef[nodeIndex];
                }
            } else {
                dataObjectRefSingle = dataObjectRef;
            }

            if (useTogglebehaviour) {
                dataObjectRefSingle.isVisible = !dataObjectRefSingle.isVisible;
                makeVisible = dataObjectRefSingle.isVisible;
            }
            dataObjectRefSingle.isVisible = makeVisible;
            if (loopArray) {
                for (var i = 1; i < dataObjectRef.length; i++) {
                    dataObjectRef[i].isVisible = makeVisible;
                }
            }
           
            if (makeVisible) {               
                classScope.api.show(dataObjectRefSingle.instanceID);
                if (loopArray) {
                    for (var i = 1; i < dataObjectRef.length; i++) {
                        classScope.api.show(dataObjectRef[i].instanceID);
                    }
                }
            } else {
                classScope.api.hide(dataObjectRefSingle.instanceID);
                if (loopArray) {
                    for (var i = 1; i < dataObjectRef.length; i++) {
                        classScope.api.hide(dataObjectRef[i].instanceID);
                    }
                }
            }
        }
    }

    this.toggleNodeVisibility = function (key, nodeIndex, currentNodeType) {
        classScope.setNodeVisibility(key, null, nodeIndex, currentNodeType);
    }

    this.getMaterialObject = function (materialName) {
        var materialObjectRef = classScope.materialHash[materialName];
        if (materialObjectRef == null) {
            console.error('a call to getMaterialObject using material name ' + materialName + ' has failed , no such material found');
            return null;
        }

        return materialObjectRef;
    }

    this.getChannelObject = function (materialObjectRef, channelPropertyName) {
       
        var channelObjectRef = materialObjectRef.channels[channelPropertyName];
        if (channelObjectRef == null) {
            console.error('a call to getChannelObject using channelPropertyName name ' + channelPropertyName + ' has failed , no such channelPropertyName found');
            return null;
        }
        return channelObjectRef;
    }

   

    this.setFactor = function (materialName, channelPropertyName, factor, performCacheReset) {
        if (factor == null) {
            console.error('a call to setAlpha needs to pass both the material name and the factor value to set the alpha');
            return;
        }

        performCacheReset = performCacheReset || false;
        var materialObjectRef = classScope.getMaterialObject(materialName);
        if (materialObjectRef != null) {
            var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
            if (channelObjectRef != null) {

                if (performCacheReset) {
                    if (channelObjectRef.factorIsCached != undefined) {
                        channelObjectRef.factor = factorCached;
                        classScope.api.setMaterial(materialObjectRef, function () {

                        });
                        return;
                    } else {
                        if (classScope.enableDebugLogging) {
                            console.log("a call to reset factor has been ignored since the factor has not changed");
                        }
                        return;
                    }

                }

               
                if (channelObjectRef.factorIsCached == undefined) {
                    channelObjectRef.factorIsCached = true;
                    channelObjectRef.factorCached = channelObjectRef.factor;
                }
                channelObjectRef.factor = factor;
                classScope.api.setMaterial(materialObjectRef, function () {

                });

            }
        }


    }

    this.resetFactor = function (materialName, channelPropertyName) {
        classScope.setFactor(materialName, channelPropertyName, 0, true);

    }

    this.setAlpha = function (materialName, factor) {
        classScope.setFactor(materialName, classScope.Opacity, factor);
    }

    this.resetAlpha = function (materialName) {
        classScope.setFactor(materialName, classScope.Opacity, 0, true);

    }

    this.setTexture = function (materialName, channelPropertyName, url, textureObjectDefaults, performCacheReset) {
        
        performCacheReset = performCacheReset || false;
        var materialObjectRef = classScope.getMaterialObject(materialName);
        if (materialObjectRef != null) {
            var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
            if (channelObjectRef != null) {

                if (performCacheReset) {
                    if (channelObjectRef.textureIsCached != undefined) {
                        channelObjectRef.texture = channelObjectRef.textureCached;                      
                        classScope.api.setMaterial(materialObjectRef, function () {

                        });
                        return;
                    } else {
                        if (classScope.enableDebugLogging) {
                            console.log("a call to reset a texture has been ignored since the texture has not changed");
                        }
                        return;
                    }

                }

               
                if (channelObjectRef.textureIsCached == undefined) {
                    channelObjectRef.textureIsCached = true;
                    channelObjectRef.textureCached = channelObjectRef.texture;


                }
                
                //if the material never had a texture object to begin with we need to generate one for it
                //else use the existing object to try preserve all properties excpt the texture uid obviously
                var texob = {};
                if (channelObjectRef.textureCached == null) {
                    var texob = {};
                    texob.internalFormat = "RGB";
                    texob.magFilter = "LINEAR";
                    texob.minFilter = "LINEAR_MIPMAP_LINEAR";
                    texob.texCoordUnit = 0;
                    texob.textureTarget = "TEXTURE_2D";
                    texob.uid = 0; // not actual value , the uid still needs to be returned from a succcessful texture upload.
                    texob.wrapS = "REPEAT";
                    texob.wrapT = "REPEAT";

                    // default properties for a newly created texture object are not always as coded above
                    //when needed, pass in an object with any alternate specified properities and they will be used
                    if (textureObjectDefaults != null) {
                        for (var prop in textureObjectDefaults) {                           
                            texob[prop] = textureObjectDefaults[prop];                           
                        }
                    }
                } else {
                    //deep copy
                    for (var prop in channelObjectRef.textureCached) {
                        texob[prop] = channelObjectRef.textureCached[prop];
                    }
                }

                function addTextureCallback(err, uid) {
                    classScope.textureLoadingCount--;
                    if (classScope.textureLoadedCallback != null) {
                        classScope.textureLoadedCallback(classScope.textureLoadingCount);

                    }
                    if (err) {
                        console.log('Error when calling  api.addTexture');
                        return;
                    };

                    texob.uid = uid;
                    channelObjectRef.texture = texob;

                    classScope.api.setMaterial(materialObjectRef, function () {

                    });


                }

                if (url == null) {
                    channelObjectRef.texture = null;
                    delete channelObjectRef.texture;
                    classScope.api.setMaterial(materialObjectRef);
                } else {
                    classScope.api.addTexture(url, addTextureCallback);
                    classScope.textureLoadingCount++;
                    if (classScope.textureLoadedCallback != null) {
                        classScope.textureLoadedCallback(classScope.textureLoadingCount);

                    }
                }

            }
        }


    }

    this.resetTexture = function (materialName, channelPropertyName) {
        classScope.setTexture(materialName, channelPropertyName, "",null, true);

    }


    this.setColor = function (materialName, channelPropertyName, hex,performCacheReset) {
       
        performCacheReset = performCacheReset || false;
        var materialObjectRef = classScope.getMaterialObject(materialName);
        if (materialObjectRef != null) {
            var channelObjectRef = classScope.getChannelObject(materialObjectRef,channelPropertyName);
            if (channelObjectRef != null) {

                if (performCacheReset) {
                    if (channelObjectRef.colorIsCached != undefined) {
                        channelObjectRef.color[0] = channelObjectRef.colorCached[0];
                        channelObjectRef.color[1] = channelObjectRef.colorCached[1];
                        channelObjectRef.color[2] = channelObjectRef.colorCached[2];
                        classScope.api.setMaterial(materialObjectRef, function () {

                        });
                        return;
                    } else {
                        if (classScope.enableDebugLogging) {
                            console.log("a call to reset a color has been ignored since the color has not changed");
                        }
                        return;
                    }

                }

                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                var colorObjectExists = false;

                if (channelObjectRef.color == null) {
                   
                    channelObjectRef.color = [1,1,1];
                } 


                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (channelObjectRef.colorIsCached == undefined) {
                   
                    channelObjectRef.colorIsCached = true;
                    channelObjectRef.colorCached = [];
                    channelObjectRef.colorCached[0] = channelObjectRef.color[0];
                    channelObjectRef.colorCached[1] = channelObjectRef.color[1];
                    channelObjectRef.colorCached[2] = channelObjectRef.color[2];                   


                }

                channelObjectRef.color[0] = classScope.srgbToLinear( parseInt(result[1], 16) / 255);
                channelObjectRef.color[1] = classScope.srgbToLinear(parseInt(result[2], 16) / 255);
                channelObjectRef.color[2] = classScope.srgbToLinear(parseInt(result[3], 16) / 255);
                classScope.api.setMaterial(materialObjectRef, function () {

                });

            }
        }       

    }

    this.resetColor = function (materialName, channelPropertyName) {
        classScope.setColor(materialName, channelPropertyName, "", true);

    }


   this.linearToSrgb = function (c) {
        var v = 0.0;
        if (c < 0.0031308) {
            if (c > 0.0)
                v = c * 12.92;
        } else {
            v = 1.055 * Math.pow(c, 1.0 / classScope.gamma) - 0.055;
        }
        return v;
    };

    this.srgbToLinear = function (c) {
        var v = 0.0;
        if (c < 0.04045) {
            if (c >= 0.0)
                v = c * (1.0 / 12.92);
        } else {
            v = Math.pow((c + 0.055) * (1.0 / 1.055), classScope.gamma);
        }
        return v;
    };



    //---------------------animation code .. bugs in sketchfabs api so have removed for now

    /*
   this.PlayAnimationClip = function (key, _playOnceOnly) {
       //clear any possible intervals
       clearInterval(classScope.animationTimerIntervalID);


       classScope.playAnimationClipOnceOnly = _playOnceOnly || false;
       var dataObjectRef = classScope.getAnimationObject(key);
       
       if (dataObjectRef != null) {
           classScope.currentAnimationObject = dataObjectRef;
           classScope.api.setCurrentAnimationByUID(dataObjectRef.uid,classScope.OnSetAnimationClip);
       }
      
      
   }

   this.OnSetAnimationClip = function (err) {
       console.log("OnSetAnimationClip " + classScope.currentAnimationObject.name);
       classScope.api.play(classScope.OnPlayAnimationClip);
      // classScope.api.seekTo(0);
       
   }

   this.OnPlayAnimationClip = function (err) {
       console.log("OnPlayAnimationClip " + classScope.currentAnimationObject.name);
        classScope.api.seekTo(0,classScope.OnSeekAnimationClip);
      
      
   }

   this.OnSeekAnimationClip = function () {
       console.log("OnSeekAnimationClip " + classScope.currentAnimationObject.name);
       if (classScope.playAnimationClipOnceOnly) {
           classScope.animationTimerIntervalID = setInterval(classScope.animationTimerInterval, 10);
       }
   }

   this.animationTimerInterval = function(){
       classScope.api.getCurrentTime(function (err, time) {
           console.log(time + " | " + classScope.currentAnimationObject.length);
           if(time>= classScope.currentAnimationObject.length-0.05){
               clearInterval(classScope.animationTimerIntervalID);
               classScope.api.seekTo(classScope.currentAnimationObject.length - 0.05);
               classScope.api.pause();
              
               
           }
       } );
      
   }
   */


    classScope.create();





}
