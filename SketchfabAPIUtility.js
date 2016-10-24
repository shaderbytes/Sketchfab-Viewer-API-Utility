//code by shaderbytes//

function SketchfabAPIUtility(urlIDRef, iframeRef, callbackRef, clientInitObjectRef) {
    var classScope = this;
    this.api;
    this.client;
    this.clientInitObject = {  internal:0, ui_infos: 0, ui_controls: 0, watermark: 1, continuous_render: 0, supersample: 0 };//These are the default init properies , you can change these if you like. The success and error properties defaults are set later , they should NOT be altered 
    if (clientInitObjectRef != null) {
        for (var prop in clientInitObjectRef) {
           // if (classScope.clientInitObject[prop] != undefined && classScope.clientInitObject[prop] != null) {
                classScope.clientInitObject[prop] = clientInitObjectRef[prop];
           // }
        }
    }
    this.iframe = iframeRef;
    this.urlID = urlIDRef;
    this.materialHash = {};
    this.nodeHash = {};
    this.includeGeometryNodes = false;
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
    this.annotationLength = 0;
    this.currentAnnotationIndex = -1;
    this.currentAnnotationObject = {};

    //preprocessflags
    this.materialPreprocessCompleted = false;
    this.nodePreprocessCompleted = false;
    this.annotationPreprocessCompleted = false;

    this.create = function () {
        classScope.client = new Sketchfab(null, classScope.iframe);

        classScope.clientInitObject.success = classScope.onClientInit;
        classScope.clientInitObject.error = classScope.onClientError;

        classScope.client.init(classScope.urlID, classScope.clientInitObject);
    };
    this.onClientError = function () {
        console.error('a call to "init()" on the sketchfab client object has failed');
    };


    this.onClientInit = function (apiRef) {
        classScope.api = apiRef;
        classScope.api.start();
        classScope.api.addEventListener('viewerready', classScope.onViewerReady);
    };

    this.onViewerReady = function () {

        //prepare data for ease of use

        //for each call into the api that gets used for preprocesing a flag should be created which can be validated to decide that the 
        //utility has finished all preprocessing

        classScope.api.getMaterialList(classScope.generateMaterialHash);
        classScope.api.getNodeMap(classScope.generateNodeHash);
        classScope.api.getAnnotationList(classScope.generateAnnotationControls);
        //possible other calls here ...

       

    };

   

    this.validateUtilGenerationPreprocess = function () {

        //validate all used preprocess flags
        if (classScope.materialPreprocessCompleted && classScope.nodePreprocessCompleted && classScope.annotationPreprocessCompleted) {
            classScope.callback();
        }
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

    this.generateNodeHash = function (err, nodes) {
       
        if (err) {
            console.log('Error when calling getNodeMap');
            return;
        };
       
        for (var prop in nodes) {
            var node = nodes[prop];
          
            var geometryNodeTypeString = "I_dont_want_to_be_found";
            if (classScope.includeGeometryNodes) {
                geometryNodeTypeString = "Geometry";
            }
            if (node.name != undefined) {
                if ((node.type == "MatrixTransform" || node.type == geometryNodeTypeString) && (node.name.indexOf(".fbx") === -1) && (node.name.indexOf(".FBX") === -1)  && (node.name !== "RootNode")) {
                    node.isVisible = true;
                    if (classScope.nodeHash[node.name] != null) {
                        //so now we have nodes with the same name and need to convert this storage into an array or push into that array
                        if (!Array.isArray(classScope.nodeHash[node.name])) {

                            var nodeTemp = classScope.nodeHash[node.name];
                            classScope.nodeHash[node.name] = null;
                            classScope.nodeHash[node.name] = [];
                            classScope.nodeHash[node.name].push(nodeTemp);
                            classScope.nodeHash[node.name].push(node);

                        } else {
                            classScope.nodeHash[node.name].push(node);
                        }

                    } else {
                        classScope.nodeHash[node.name] = node;
                    }

                }
            }
        };

        if (classScope.enableDebugLogging) {
            console.log("nodes listing");
            for (var key in classScope.nodeHash) {
                if (Array.isArray(classScope.nodeHash[key])) {
                    console.log("multiple nodes with same name ,use name and index to reference a single instance, if no index is passed in conjunction with this name, all nodes with this name would be affected: ")
                    for (var i = 0; i < classScope.nodeHash[key].length; i++) {
                        console.log("name: " + classScope.nodeHash[key][i].name + " index: " + i);
                    }
                } else {
                    console.log("unique node name, use only name to retrieve: ");
                    console.log("name: " + classScope.nodeHash[key].name);
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

    this.getNodeObject = function (nodeName,nodeIndex) {
        var nodeObjectRef = classScope.nodeHash[nodeName];
        if (nodeObjectRef == null) {
            console.error('a call to  getNodeObject using node name ' + nodeName + ' has failed , no such node found');
            return null;
        }

        if (nodeIndex != null) {
            if (Array.isArray(nodeObjectRef)) {
                if (nodeIndex < 0 || nodeIndex >= nodeObjectRef.length) {
                    console.error('a call to  getNodeObject using node name ' + nodeName + ' has failed , the nodeIndex is out of range. You can pass an array index ranging : 0 - ' + (nodeObjectRef.length - 1));
                    return;
                } else {
                    nodeObjectRef = nodeObjectRef[nodeIndex];
                }
            }
        }

        // take note the returned object could be a direct reference to the node object if it is unique , or it returns an array of node objects if they share the same name
        //or it could be a direct refrence to the node object within the array if you passed in a nodeIndex and the name is mapped to an array
        
        return nodeObjectRef;
    }

    this.lookat = function (nodeName, direction,distance, duration, callback) {
        var nodeObjectRef = classScope.getNodeObject(nodeName);
        var nodeObjectRefSingle;
        if (nodeObjectRef != null) {
            if (direction == null) {
                direction = classScope.vectorForward;
            }
            if (distance == null) {
                distance = 10;
            }
            if (Array.isArray(nodeObjectRef)) {
                console.log("multiple nodes returned during call to lookat, first node will be used");
                nodeObjectRefSingle = nodeObjectRef[0];
            } else {
                nodeObjectRefSingle = nodeObjectRef;
            }

           
            var target = [nodeObjectRefSingle.worldMatrix[12], nodeObjectRefSingle.worldMatrix[13], nodeObjectRefSingle.worldMatrix[14]];
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

    this.translate = function (nodeName, direction,distance, duration, easing, callback) {

        var nodeObjectRef = classScope.getNodeObject(nodeName);
        var nodeObjectRefSingle;
        if (nodeObjectRef != null) {
            if (direction == null) {
                direction = classScope.vectorForward;
            }
            if (distance == null) {
                distance = 1;
            }
            if (Array.isArray(nodeObjectRef)) {
                console.log("multiple nodes returned during call to lookat, first node will be used");
                nodeObjectRefSingle = nodeObjectRef[0];
            } else {
                nodeObjectRefSingle = nodeObjectRef;
            }
            if (nodeObjectRefSingle.worldMatrixisCached = undefined) {
                nodeObjectRefSingle.worldMatrixisCached = true;
                nodeObjectRefSingle.worldMatrixCached = nodeObjectRefSingle.worldMatrix;
            
            }
           
            var currentPosition = [nodeObjectRefSingle.worldMatrix[12], nodeObjectRefSingle.worldMatrix[13], nodeObjectRefSingle.worldMatrix[14]];
            var newPosition = [currentPosition[0] + (direction[0] * distance), currentPosition[1] + (direction[1] * distance), currentPosition[2] + (direction[2] * distance)];
            //write new position back into matrix
            nodeObjectRefSingle.worldMatrix[12] = newPosition[0];
            nodeObjectRefSingle.worldMatrix[13] = newPosition[1];
            nodeObjectRefSingle.worldMatrix[14] = newPosition[2];
            classScope.api.translate(nodeObjectRef.instanceID, newPosition, duration,easing, callback);

        }

    }


    this.setNodeVisibility = function (nodeName, makeVisible,nodeIndex) {
        var useTogglebehaviour = false;
        if (makeVisible == null) {
            useTogglebehaviour = true;
        }
        var nodeObjectRef = classScope.getNodeObject(nodeName);
        var nodeObjectRefSingle;
        var loopArray = false;
        if (nodeObjectRef != null) {

            if (Array.isArray(nodeObjectRef)) {
                if (nodeIndex == null) {
                    loopArray = true;
                    nodeObjectRefSingle = nodeObjectRef[0];
                } else if (nodeIndex < 0 || nodeIndex >= nodeObjectRef.length) {
                    console.error('a call to  setNodeVisibility using node name ' + nodeName + ' has failed , this name is mapped to multiple objects and requires you to pass an array index ranging : 0 - ' + (nodeObjectRef.length - 1));
                    return;
                } else {
                    nodeObjectRefSingle = nodeObjectRef[nodeIndex];
                }
            } else {
                nodeObjectRefSingle = nodeObjectRef;
            }

            if (useTogglebehaviour) {
                nodeObjectRefSingle.isVisible = !nodeObjectRefSingle.isVisible;
                makeVisible = nodeObjectRefSingle.isVisible;
            }
            nodeObjectRefSingle.isVisible = makeVisible;
            if (loopArray) {
                for (var i = 1; i < nodeObjectRef.length; i++) {
                    nodeObjectRef[i].isVisible = makeVisible;
                }
            }

            if (makeVisible) {               
                classScope.api.show(nodeObjectRefSingle.instanceID);
                if (loopArray) {
                    for (var i = 1; i < nodeObjectRef.length; i++) {
                        classScope.api.show(nodeObjectRef[i].instanceID);
                    }
                }
            } else {
                classScope.api.hide(nodeObjectRefSingle.instanceID);
                if (loopArray) {
                    for (var i = 1; i < nodeObjectRef.length; i++) {
                        classScope.api.hide(nodeObjectRef[i].instanceID);
                    }
                }
            }
        }
    }

    this.toggleNodeVisibility = function (nodeName,nodeIndex) {
        classScope.setNodeVisibility(nodeName, null, nodeIndex);
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

                classScope.api.addTexture(url, addTextureCallback);
                classScope.textureLoadingCount++;
                if(classScope.textureLoadedCallback != null){
                    classScope.textureLoadedCallback(classScope.textureLoadingCount);

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


    classScope.create();





}
