//code by shaderbytes//

function SketchfabAPIUtility(urlIDRef, iframeRef, clientInitObjectRef) {
    var classScope = this;
    this.version = "2.0.0.8";
    this.api = null;
    this.client = null;
    this.clientInitObject = {"merge_materials": 0,"graph_optimizer": 0 };//if you want any default init options hard coded just add them here
    if (clientInitObjectRef !== null) {
        for (var prop in clientInitObjectRef) {       
            classScope.clientInitObject[prop] = clientInitObjectRef[prop];
          
        }
    }
    this.textureCache = {};
    this.isInitialized = false;
    this.iframe = iframeRef;
    this.urlID = urlIDRef;
    this.materialHash = {};
    //node hash stores matrix transform nodes by name
    this.nodeHash = {};

    this.materialsUIDPending = {};
    

    this.nodeTypeMatrixtransform = "MatrixTransform";
    this.nodeTypeCurrent = classScope.nodeTypeMatrixtransform;
    this.nodeTypeGeometry = "Geometry";
    this.nodeTypeGroup = "Group";
    this.nodeTypeRigGeometry = "RigGeometry";
    this.nodeNameCurrent = "";
    classScope.nodeHash[classScope.nodeTypeMatrixtransform] = {};
    classScope.nodeHash[classScope.nodeTypeGeometry] = {};
    classScope.nodeHash[classScope.nodeTypeGroup] = {};
    classScope.nodeHash[classScope.nodeTypeRigGeometry] = {};

    this.nodeHashIDMap = {};
    this.eventListeners = {};
    this.nodesRaw = null;  
    this.enableDebugLogging = true;
    
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
    this.ClearCoat = "ClearCoat";
    this.ClearCoatNormalMap = "ClearCoatNormalMap";
    this.ClearCoatRoughness = "ClearCoatRoughness";
    this.Matcap = "Matcap";
    this.SubsurfaceScattering = "SubsurfaceScattering";
    this.SubsurfaceTranslucency = "SubsurfaceTranslucency";

    this.vectorForward = [0, -1, 0];
    this.vectorBackward = [0, 1, 0];
    this.vectorLeft = [-1,0, 0];
    this.vectorRight = [1, 0, 0];
    this.vectorUp = [0, 0, 0.999];
    this.vectorDown = [0, 0, -0.999];

    this.textureLoadingCount = 0;
    this.gamma = 2.4;
   

    this.annotations = [];
    this.animationClips = {};
    this.annotationLength = 0;
    this.animationClipsLength = 0;
    this.currentAnnotationIndex = -1;
    this.currentAnnotationObject = {};

    this.currentAnimationObject = {};

    this.animationTimerIntervalID=  null;
    this.playAnimationClipOnceOnly = false;

    //preprocessflags
    this.materialPreprocessCompleted = false;
    this.nodePreprocessCompleted = false;
    this.annotationPreprocessCompleted = false;
    this.animationPreprocessCompleted = false;

    this.EVENT_INITIALIZED = "event_initialized";
    this.EVENT_CLICK = "event_click";
    this.EVENT_TEXTURE_APPLIED = "event_texture_applied";
    this.EVENT_ANNOTATION_CHANGED = "event_annotation_changed";

    this.create = function () {
       
        classScope.client = new Sketchfab(classScope.iframe);

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
       
    };

    this.onViewerReady = function () {
       
        //prepare data for ease of use

        //for each call into the api that gets used for preprocesing a flag should be created which can be validated to decide that the 
        //utility has finished all preprocessing       
        classScope.api.getMaterialList(classScope.generateMaterialHash);        
        classScope.api.getSceneGraph(classScope.generateNodeHashRecursive);
        classScope.api.getAnnotationList(classScope.generateAnnotationControls);
        classScope.api.getAnimations(classScope.generateAnimationControls);
        //possible other calls here ...

       

    };

   

    this.validateUtilGenerationPreprocess = function () {

        //validate all used preprocess flags
        if (classScope.materialPreprocessCompleted && classScope.nodePreprocessCompleted && classScope.annotationPreprocessCompleted && classScope.animationPreprocessCompleted) {
            classScope.isInitialized = true;
            classScope.dispatchEvent(classScope.EVENT_INITIALIZED, true);
          
        }
    };

    this.generateAnimationControls = function (err, animations) {
        if (err) {
            console.log('Error when calling getAnimations');
            return;
        }
        if (classScope.enableDebugLogging) {
            console.log("animation listing");
            console.log(animations);
        }

        for (var i = 0; i < animations.length; i++) {

            var ob = classScope.animationClips[animations[i][1]] = {};
            ob.name = animations[i][1];
            ob.uid = animations[i][0];
            ob.length = animations[i][2];
           
        }     
        classScope.animationClipsLength = animations.length;

        classScope.animationPreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    };

    this.getAnimationObject = function (key) {
        var dataObjectRef = classScope.animationClips[key];
        if (dataObjectRef === null) {
            console.error('a call to  getAnimationObject using key/name ' + key + ' has failed , no such object found');
            return null;
        }
        return dataObjectRef;
    };
   
   

    this.generateMaterialHash = function (err, materials) {
        if (err) {
            console.log('Error when calling getMaterialList');
            return;
        }
        if (classScope.enableDebugLogging) {
            console.log("materials listing");
            
        }
        for (var i = 0; i < materials.length; i++) {
           
            classScope.materialHash[materials[i].name] = materials[i];
            if (classScope.enableDebugLogging) {
                console.log("name: " + materials[i].name);
            }
        }
        classScope.materialPreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    };

    this.addEventListener = function(event,func){
        if (classScope.eventListeners[event] === null || classScope.eventListeners[event] === undefined ) {
            classScope.eventListeners[event] = [];
            if (event == classScope.EVENT_CLICK) {
                if (classScope.isInitialized) {
                    classScope.api.addEventListener("click", classScope.onClick,{ pick: 'slow' });
                } else {
                    console.log("a call to add a click event listener has been rejected because this utility has not completed initialization");
                    return;
                }
            }
        }
        classScope.eventListeners[event].push(func);
    };

    this.removeEventListener = function (event, func) {
        if (classScope.eventListeners[event] !== null) {
            for (var i = classScope.eventListeners[event].length-1; i >= 0; i--) {
                if (classScope.eventListeners[event][i] == func) {
                    classScope.eventListeners[event].splice(i, 1);
                }
            }
            if (classScope.eventListeners[event].length === 0) {
                classScope.eventListeners[event] = null;
                if (event == classScope.EVENT_CLICK) {
                    classScope.api.removeEventListener("click", classScope.onClick);
                }
            }

        }
    };

    this.dispatchEvent = function (eventName, eventObject) {
     
        var eventArray = classScope.eventListeners[eventName];
        if (eventArray !== null && eventArray !== undefined) {           
            for (var i = 0; i < eventArray.length; i++) {
                eventArray[i](eventObject);

            }
        }

    }
    // this function will not just reference the actual parent but will rather transverse the object graph until a parent of type group is found
    this.getParentGroup = function (node) {
        var parentGroup = node.parent;
        if (parentGroup !== null && parentGroup !== undefined) {
            while (parentGroup.type !== classScope.nodeTypeGroup) {
                parentGroup = parentGroup.parent;
            }
        }
        return parentGroup;
    }
    // this function will not just reference the actual parent but will rather transverse the object graph until a parent of type Matrix Transform is found
    this.getParentMatrixTransform = function (node) {
        var parentMatrixTransform = node.parent;
        if (parentMatrixTransform !== null && parentMatrixTransform !== undefined) {
            while (parentMatrixTransform.type !== classScope.nodeTypeMatrixtransform) {
                parentMatrixTransform = parentMatrixTransform.parent;
            }
        }
        return parentMatrixTransform;
    }


    this.onClick = function (e) {
        if (e.instanceID === null || e.instanceID === undefined || e.instanceID === -1) {
            return;
        }
      
        var node = classScope.getNodeObject(e.instanceID);    
        e.node = node;
        e.parentGroup = classScope.getParentGroup(node);
        e.parentMatrixTransform = classScope.getParentMatrixTransform(node);
        classScope.dispatchEvent(classScope.EVENT_CLICK, e);
       
    };

    this.validateNodeName = function (nodeNameRef) {
        var nodeName = nodeNameRef.split(" ").join("").toLowerCase();

        if (nodeName === null || nodeName === undefined) {

            return false;
        }

        if (typeof (nodeName) == "string") {

            if (nodeName.length === 0) {

                return false;
            }
            if (nodeName == "rootmodel") {

                return false;
            }

            if (nodeName.indexOf("rootnode") != -1) {

                return false;
            }

            if (nodeName == "scene-polygonnode") {

                return false;
            }
            if (nodeName.indexOf("fbx") != -1) {

                return false;
            }



            if (nodeName.indexOf("undefined") != -1) {

                return false;
            }
        }

        return true;

    };

    this.generateNodeName = function (node) {
        if (node.name === null || node.name === undefined || node.name === "undefined") {
            return "undefined_" + node.instanceID;
        } else {
            return node.name;
        }
    };

   

    this.handleNode = function(node, types,parent){		
		
        if (types.indexOf(node.type) >= 0) {

			
            classScope.nodeTypeCurrent = node.type;
            classScope.nodeNameCurrent = classScope.generateNodeName(node);
            node.name = classScope.nodeNameCurrent;

            var n = classScope.nodeHash[classScope.nodeTypeCurrent];

            node.isVisible = true;
            node.parent = parent;
            node.index = 0;

            if(n[classScope.nodeNameCurrent] !== undefined && n[classScope.nodeNameCurrent] !== null){

                if (!Array.isArray(n[classScope.nodeNameCurrent])) {

                    var nodeTemp = n[classScope.nodeNameCurrent];
                    n[classScope.nodeNameCurrent] = null;
                    n[classScope.nodeNameCurrent] = [];
                    n[classScope.nodeNameCurrent].push(nodeTemp);
                    nodeTemp.index =  n[classScope.nodeNameCurrent].length-1;
                    n[classScope.nodeNameCurrent].push(node);
                    node.index =  n[classScope.nodeNameCurrent].length-1;
                    classScope.nodeHashIDMap[node.instanceID] = n[classScope.nodeNameCurrent];

                } else {
                    n[classScope.nodeNameCurrent].push(node);
                    node.index =  n[classScope.nodeNameCurrent].length-1;
                    classScope.nodeHashIDMap[node.instanceID] = n[classScope.nodeNameCurrent];
                }

            } else {
                n[classScope.nodeNameCurrent] = node;
                classScope.nodeHashIDMap[node.instanceID] = n[classScope.nodeNameCurrent];
            }
            if(node.children === null || node.children === undefined){
                return;
            }

            if (node.children.length === 0) {
                return;
            }else{

                // recurse through the children
                for(var i = 0; i < node.children.length; i++) {
                    var child = node.children[i];
                    this.handleNode(child, types, node);
                }
			
            }           
            
        }

        
    };

    this.generateNodeHashRecursive = function (err, root) {

        if (err) {
            console.log('Error when calling getSceneGraph', err);
            return;
        }
        classScope.nodesRaw = root;
      
        var types = [classScope.nodeTypeMatrixtransform, classScope.nodeTypeGeometry, classScope.nodeTypeGroup, classScope.nodeTypeRigGeometry];

        classScope.handleNode(root, types,null);

        if (classScope.enableDebugLogging) {
            for (var m = 0; m < types.length; m++) {
                console.log(" ");
                console.log("nodes listing " + types[m]);
                var p = classScope.nodeHash[types[m]];
                for (var key in p) {
                    if (Array.isArray(p[key])) {
                        console.log("multiple nodes with same name ,use name and index to reference a single instance, if no index is passed in conjunction with this name, all nodes with this name would be affected: ");
                        for (var i = 0; i < p[key].length; i++) {
                            console.log("name: " + p[key][i].name + " index: " + i);
                        }
                    } else {
                        console.log("unique node name, use only name to retrieve: ");
                        console.log("name: " + p[key].name);
                    }
                }
            }
        }

        classScope.nodePreprocessCompleted = true;
        classScope.validateUtilGenerationPreprocess();
    };
    this.logObjectkeysAndValues = function (objectToLog) {
        if (Array.isArray(objectToLog)) {
            for (var i = 0; i < objectToLog.length; i++) {
                console.log("array index: " + i + " = " + objectToLog[i]);
            }

        } else {

            for (var prop in objectToLog) {
                console.log(prop + " = " + objectToLog[prop]);
            }
        }
    };

    this.annotationChanged = function (index) {
        if (isNaN(index)) {
            return;
        }
        if (index === -1) {
            return;
        }       
        classScope.currentAnnotationIndex = index;
        classScope.currentAnnotationObject = classScope.annotations[classScope.currentAnnotationIndex];
        classScope.dispatchEvent(classScope.EVENT_ANNOTATION_CHANGED, classScope.currentAnnotationObject);
    }

    this.generateAnnotationControls = function (err, annotations) {
        if (err) {
            console.log('Error when calling getAnnotationList');
            return;
        }
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

        if (classScope.annotationLength > 0) {
            classScope.api.addEventListener('annotationSelect', classScope.annotationChanged);
        }

        classScope.validateUtilGenerationPreprocess();
    };

    this.gotoNextAnnotation = function () {
        if (classScope.annotationLength === 0) return;
        classScope.currentAnnotationIndex++;
        if (classScope.currentAnnotationIndex >= classScope.annotationLength) {
            classScope.currentAnnotationIndex = 0;
        }
        classScope.currentAnnotationObject = classScope.annotations[classScope.currentAnnotationIndex];
        classScope.api.gotoAnnotation(classScope.currentAnnotationIndex);
    };

    this.gotoPreviousAnnotation = function () {
        if (classScope.annotationLength === 0) return;
        classScope.currentAnnotationIndex--;
        if (classScope.currentAnnotationIndex < 0) {
            classScope.currentAnnotationIndex = classScope.annotationLength - 1;
        }
        classScope.currentAnnotationObject = classScope.annotations[classScope.currentAnnotationIndex];
        classScope.api.gotoAnnotation(classScope.currentAnnotationIndex);
    };

    this.gotoAnnotation = function (index) {
        if (classScope.annotationLength === 0) return;
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

    };
    // key can be a name or an instance id.
    this.getNodeObject = function (key, nodeIndex, currentNodeType) {
     
        var dataObjectRef;
        classScope.nodeTypeCurrent = currentNodeType || classScope.nodeTypeMatrixtransform;
        
        if (typeof key === 'string' || key instanceof String) {            
            dataObjectRef = classScope.nodeHash[classScope.nodeTypeCurrent][key];
         
        } else {
            dataObjectRef = classScope.nodeHashIDMap[key];
        }
                
       
        if (dataObjectRef === null || dataObjectRef === undefined) {
            console.error('a call to  getNodeObject using ' + currentNodeType + ' list id and using node name ' + key + ' has failed , no such node found');
            return null;
        }

        if (nodeIndex !== null) {
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
    };

    this.lookat = function (key, direction,distance, duration,offset, callback) {
        var dataObjectRef = classScope.getNodeObject(key,null,classScope.nodeTypeMatrixtransform);
        
        var dataObjectRefSingle;
        if (dataObjectRef !== null && dataObjectRef !== undefined) {
            if (direction === null || direction === undefined) {
                direction = classScope.vectorForward;
            }
            if (distance === null || distance === undefined) {
                distance = 10;
            }
            if (Array.isArray(dataObjectRef)) {
                console.log("multiple nodes returned during call to lookat, first node will be used");
                dataObjectRefSingle = dataObjectRef[0];
            } else {
                dataObjectRefSingle = dataObjectRef;
            }

           
            var target = [dataObjectRefSingle.worldMatrix[12], dataObjectRefSingle.worldMatrix[13], dataObjectRefSingle.worldMatrix[14]];
            var eye = [target[0] + (direction[0] * distance), target[1] + (direction[1] * distance), target[2] + (direction[2] * distance)];
            if (offset !== null && offset !== undefined) {
                if (Array.isArray(offset)) {
                    eye[0] += offset[0];
                    eye[1] += offset[1];
                    eye[2] += offset[2];
                    target[0] += offset[0];
                    target[1] += offset[1];
                    target[2] += offset[2];
                }
            }
            classScope.api.setCameraLookAt(eye, target, duration, callback);

        }
    };

    this.getVectorMagnitude = function (vector) {
        return Math.sqrt((vector[0] * vector[0]) + (vector[1] * vector[1]) + (vector[2] * vector[2]));

    };

    this.getVectorNormalized = function (vector) {
        var mag = classScope.getVectorMagnitude(vector);
        vector[0] /= mag;
        vector[1] /= mag;
        vector[2] /= mag;
        return vector;


    };

    this.combineVectorDirections = function () {
        var directionCombined = [0,0,0];
        for (var i = 0; i < arguments.length; i++) {
            directionCombined[0] += arguments[i][0];
            directionCombined[1] += arguments[i][1];
            directionCombined[2] += arguments[i][2];
        }       
        return classScope.getVectorNormalized(directionCombined);
    };

    
    this.refreshMatrix = function (key) {
        console.log("refreshMatrix called");
        var dataObjectRef = classScope.getNodeObject(key, null, classScope.nodeTypeMatrixtransform);
        if (dataObjectRef !== null && dataObjectRef !== undefined) {
            function matrixRefreshed(err, matrices) {

                if (err) {
                    console.log("an error occured while called refreshMatrix. Error: " + err);
                    return;
                }
               
                dataObjectRef.worldMatrix = matrices.world;
                dataObjectRef.worldMatrixisCached = null;
            }
            classScope.api.getMatrix(dataObjectRef.instanceID, matrixRefreshed);
        }

    }

    this.setPosition = function (key, position, duration, easing, callback) {
        if (duration === null || duration === undefined) {
            duration = 1;
        }
       
        var dataObjectRef = classScope.getNodeObject(key, null, classScope.nodeTypeMatrixtransform);
        var dataObjectRefSingle;
        if (dataObjectRef !== null && dataObjectRef !== undefined) {

            if (Array.isArray(dataObjectRef)) {
                console.log("multiple nodes returned during call to setPosition, first node will be used");
                dataObjectRefSingle = dataObjectRef[0];
            } else {
                dataObjectRefSingle = dataObjectRef;
            }

            function onTranslate(err, position) {


                if (err) {
                    console.log("an error occured while called setPosition. Error: " + err);
                    return;
                }

                classScope.refreshMatrix(key);
                if (callback) {
                    callback(err, position);
                }

            }

            classScope.api.translate(dataObjectRefSingle.instanceID, position, { "duration": duration, "easing": easing }, onTranslate);
            

        }
    }
  

    this.translate = function (key, direction,distance, duration, easing, callback) {

        var dataObjectRef = classScope.getNodeObject(key, null, classScope.nodeTypeMatrixtransform);
        var dataObjectRefSingle;
        if (dataObjectRef !== null && dataObjectRef !== undefined) {
            if (direction === null || direction === undefined) {
                direction = classScope.vectorForward;
            }
            if (distance === null || distance === undefined) {
                distance = 1;
            }
            if (Array.isArray(dataObjectRef)) {
                console.log("multiple nodes returned during call to translate, first node will be used");
                dataObjectRefSingle = dataObjectRef[0];
            } else {
                dataObjectRefSingle = dataObjectRef;
            }
            if (dataObjectRefSingle.worldMatrixisCached === undefined || dataObjectRefSingle.worldMatrixisCached === null) {
                dataObjectRefSingle.worldMatrixisCached = true;
                dataObjectRefSingle.worldMatrixCached = dataObjectRefSingle.worldMatrix;
            
            }
           
            var currentPosition = [dataObjectRefSingle.worldMatrix[12], dataObjectRefSingle.worldMatrix[13], dataObjectRefSingle.worldMatrix[14]];
            var newPosition = [currentPosition[0] + (direction[0] * distance), currentPosition[1] + (direction[1] * distance), currentPosition[2] + (direction[2] * distance)];
            //write new position back into matrix
            dataObjectRefSingle.worldMatrix[12] = newPosition[0];
            dataObjectRefSingle.worldMatrix[13] = newPosition[1];
            dataObjectRefSingle.worldMatrix[14] = newPosition[2];
            classScope.api.translate(dataObjectRefSingle.instanceID, newPosition, { "duration": duration, "easing": easing }, callback);

        }

    };


    this.setNodeVisibility = function (key, makeVisible, nodeIndex, currentNodeType) {
        var useTogglebehaviour = false;
        if (makeVisible === null) {
            useTogglebehaviour = true;
        }
        var dataObjectRef = classScope.getNodeObject(key, null, currentNodeType);
        var dataObjectRefSingle;
        var loopArray = false;
        var i = 0;
        if (dataObjectRef !== null && dataObjectRef !== undefined) {

            if (Array.isArray(dataObjectRef)) {
                if (nodeIndex === null) {
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
                for (i = 1; i < dataObjectRef.length; i++) {
                    dataObjectRef[i].isVisible = makeVisible;
                }
            }
           
            if (makeVisible) {               
                classScope.api.show(dataObjectRefSingle.instanceID);
                if (loopArray) {
                    for (i = 1; i < dataObjectRef.length; i++) {
                        classScope.api.show(dataObjectRef[i].instanceID);
                    }
                }
            } else {
                classScope.api.hide(dataObjectRefSingle.instanceID);
                if (loopArray) {
                    for (i = 1; i < dataObjectRef.length; i++) {
                        classScope.api.hide(dataObjectRef[i].instanceID);
                    }
                }
            }
        }
    };

    this.toggleNodeVisibility = function (key, nodeIndex, currentNodeType) {
        classScope.setNodeVisibility(key, null, nodeIndex, currentNodeType);
    };

    this.getMaterialObject = function (materialName) {
        var materialObjectRef = classScope.materialHash[materialName];
        if (materialObjectRef === null || materialObjectRef === undefined) {
            console.error('a call to getMaterialObject using material name ' + materialName + ' has failed , no such material found');
            return null;
        }

        return materialObjectRef;
    };

    this.getChannelObject = function (materialObjectRef, channelPropertyName) {
       
        var channelObjectRef = materialObjectRef.channels[channelPropertyName];
        if (channelObjectRef === null || channelObjectRef === undefined ) {
            console.error('a call to getChannelObject using channelPropertyName name ' + channelPropertyName + ' has failed , no such channelPropertyName found');
            return null;
        }
        return channelObjectRef;
    };

    this.setChannelProperties = function (materialName, channelPropertyName, channelObjectDefaults) {
        var materialObjectRef = classScope.getMaterialObject(materialName);
        var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
        classScope.setChannelPropertiesActual(channelObjectRef, channelObjectDefaults);
    }

    this.setChannelPropertiesActual = function (channelObjectRef, channelObjectDefaults) {
        for (var prop in channelObjectDefaults) {
            channelObjectRef[prop] = channelObjectDefaults[prop];
        }
    }

    //-----------------------------------------------------------------------------------------
    this.setTextureProperties = function (materialName, channelPropertyName, textureObjectDefaults) {
        var materialObjectRef = classScope.getMaterialObject(materialName);
        var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
        classScope.setTexturePropertiesActual(channelObjectRef, textureObjectDefaults);
    }

    this.setTexturePropertiesActual = function (channelObjectRef, textureObjectDefaults) {

        if (channelObjectRef.texture !== null && channelObjectRef.texture !== undefined) {
            for (var prop in textureObjectDefaults) {
                channelObjectRef.texture[prop] = textureObjectDefaults[prop];
            }
        }
       
    }

    this.logChannelPropertiesAndValues = function (materialName, channelPropertyName) {

        console.log("----------------");
        console.log("Channel " + channelPropertyName);
        console.log("----------------");

        var currentChannel = classScope.getChannelObject(classScope.getMaterialObject(materialName), channelPropertyName);
        classScope.logPropertiesAndValuesRecursive("", "", currentChannel);
    }

    this.logPropertiesAndValuesRecursive = function(s, space, ob) {
        for (prop in ob) {
            if (ob[prop] === Object(ob[prop])) {
                console.log(prop + " : ");
                var previousSpace = space;
                space += "      ";
                classScope.logPropertiesAndValuesRecursive(s, space, ob[prop]);
                space = previousSpace;

            } else {
                console.log(space + prop + " : " + ob[prop]);
            }
        }
    }
   

    this.setFactor = function (materialName, channelPropertyName, factor, performCacheReset) {
        if (factor === null) {
            console.error('a call to setAlpha needs to pass both the material name and the factor value to set the alpha');
            return;
        }

        performCacheReset = performCacheReset || false;
        var materialObjectRef = classScope.getMaterialObject(materialName);
        if (materialObjectRef !== null) {
            var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
            if (channelObjectRef !== null && channelObjectRef !== undefined) {

                if (performCacheReset) {
                    if (channelObjectRef.factorIsCached !== undefined) {
                        channelObjectRef.factor =  channelObjectRef.factorCached;
                        classScope.api.setMaterial(materialObjectRef);
                        return;
                    } else {
                        if (classScope.enableDebugLogging) {
                            console.log("a call to reset factor has been ignored since the factor has not changed");
                        }
                        return;
                    }

                }

               
                if (channelObjectRef.factorIsCached === undefined) {
                    channelObjectRef.factorIsCached = true;
                    channelObjectRef.factorCached = channelObjectRef.factor;
                }
                channelObjectRef.factor = factor;
                classScope.api.setMaterial(materialObjectRef);

            }
        }


    };

    this.resetFactor = function (materialName, channelPropertyName) {
        classScope.setFactor(materialName, channelPropertyName, 0, true);

    };

    this.setOpacity = function (materialName, factor) {
        classScope.setFactor(materialName, classScope.Opacity, factor);
    };

    this.resetOpacity = function (materialName) {
        classScope.setFactor(materialName, classScope.Opacity, 0, true);

    };
    this.resetMaterialUID = function (materialName, channelPropertyName) {

        var materialObjectRef = classScope.getMaterialObject(materialName);
        if (materialObjectRef !== null && materialObjectRef !== undefined) {
            var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
            if (channelObjectRef !== null && channelObjectRef !== undefined) {

                if (channelObjectRef.textureIsCached !== undefined && channelObjectRef.textureIsCached !== null) {
                    channelObjectRef.texture = channelObjectRef.textureCached;
                    classScope.api.setMaterial(materialObjectRef);

                }

            }

        }

    };

    
    this.setMaterialUIDPending = function (materialName, channelPropertyName, cacheKey, textureObjectDefaults, channelObjectDefaults) {

        cacheKey = cacheKey || "unset_cacheKey";

        var ob = {};
        ob.materialName = materialName;
        ob.channelPropertyName = channelPropertyName;
        ob.textureObjectDefaults = textureObjectDefaults;
        ob.channelObjectDefaults = channelObjectDefaults;

        var storage = classScope.materialsUIDPending[cacheKey];
        if (storage === null || storage === undefined) {
            storage = classScope.materialsUIDPending[cacheKey] = [];
        }

        storage.push(ob);

    };
    this.applyMaterialUIDPending = function (cacheKey) {

        if (cacheKey !== null && cacheKey !== undefined && cacheKey !== "") {
            var storage = classScope.materialsUIDPending[cacheKey];
            var uid = classScope.textureCache[cacheKey];
            if (storage !== null && storage !== undefined) {
                for (var i = 0; i < storage.length; i++) {
                    var ob = storage[i];
                    var materialName = ob.materialName;
                    var channelPropertyName = ob.channelPropertyName;
                    var textureObjectDefaults = ob.textureObjectDefaults;
                    var channelObjectDefaults = ob.channelObjectDefaults;
                    var materialObjectRef = classScope.getMaterialObject(materialName);
                    if (materialObjectRef !== null && materialObjectRef !== undefined) {
                        var channelObjectRef = classScope.getChannelObject(materialObjectRef, channelPropertyName);
                        if (channelObjectRef !== null && channelObjectRef !== undefined) {

                            //remove texture
                            if (uid === "") {

                                channelObjectRef.texture = null;
                                delete channelObjectRef.texture;
                                classScope.api.setMaterial(materialObjectRef);

                            } else {


                                //this is the cache of the original texture
                                if (channelObjectRef.textureIsCached === undefined || channelObjectRef.textureIsCached === null) {
                                    channelObjectRef.textureIsCached = true;
                                    channelObjectRef.textureCached = channelObjectRef.texture;
                                }

                                //this is to add channel object defaults
                                if (channelObjectDefaults !== null && channelObjectDefaults !== undefined) {
                                    classScope.setChannelPropertiesActual(channelObjectRef, channelObjectDefaults);                                   
                                }

                                //if no texture property exists , create one , if it does exist, copy it
                                var texob = {};
                                var prop = null;
                                if (channelObjectRef.textureCached === null || channelObjectRef.textureCached === undefined) {
                                    texob = {};
                                    texob.internalFormat = "RGB";
                                    texob.magFilter = "LINEAR";
                                    texob.minFilter = "LINEAR_MIPMAP_LINEAR";
                                    texob.texCoordUnit = 0;
                                    texob.textureTarget = "TEXTURE_2D";
                                    texob.uid = 0; // not actual value , the uid still needs to be returned from a succcessful texture upload.
                                    texob.wrapS = "REPEAT";
                                    texob.wrapT = "REPEAT";

                                } else {
                                    //deep copy
                                    for (prop in channelObjectRef.textureCached) {
                                        texob[prop] = channelObjectRef.textureCached[prop];
                                    }
                                }


                                channelObjectRef.texture = texob;

                                //this is to add texture object defaults
                                if (textureObjectDefaults !== null && textureObjectDefaults !== null) {
                                    classScope.setTexturePropertiesActual(channelObjectRef, textureObjectDefaults);
                                }                                

                                channelObjectRef.texture.uid = uid;
                                classScope.api.setMaterial(materialObjectRef);
                            }
                        }
                    }
                }

                classScope.materialsUIDPending[cacheKey] = null;
                storage = null;
                delete classScope.materialsUIDPending[cacheKey];

                classScope.dispatchEvent(classScope.EVENT_TEXTURE_APPLIED, cacheKey);
            }
        }

    };

    this.removeTexture = function (cacheKey) {
        cacheKey = cacheKey || "unset_cacheKey";
        classScope.textureCache[cacheKey] = "";
        classScope.applyMaterialUIDPending(cacheKey);

    };

    this.addTexture = function (url, cacheKey, useCashing) {
        useCashing = useCashing || false;
        cacheKey = cacheKey || "unset_cacheKey";
        if (useCashing) {
            if (classScope.textureCache[cacheKey] !== null && classScope.textureCache[cacheKey] !== undefined) {               
                classScope.applyMaterialUIDPending(cacheKey);
                return;
            }
        }
        function addTextureCallback(err, uid) {
            classScope.textureCache[cacheKey] = uid;
            classScope.applyMaterialUIDPending(cacheKey);
            classScope.dispatchEvent(classScope.EVENT_TEXTURE_LOADED, { "cacheKey": cacheKey });
        }

        // validate if the uid exists and if so rather use update texture , otherwise use addTexture
        if (classScope.textureCache[cacheKey] !== null && classScope.textureCache[cacheKey] !== undefined) {
            classScope.api.updateTexture(url, classScope.textureCache[cacheKey], addTextureCallback);
        } else {
            classScope.api.addTexture(url, addTextureCallback);
        }
    };

    this.resetTexture = function (materialName, channelPropertyName) {

        classScope.resetMaterialUID(materialName, channelPropertyName);

    };


    this.setColor = function (materialName, channelPropertyName, hex,performCacheReset) {
       
        performCacheReset = performCacheReset || false;
        var materialObjectRef = classScope.getMaterialObject(materialName);
        if (materialObjectRef !== null && materialObjectRef !== undefined) {
            var channelObjectRef = classScope.getChannelObject(materialObjectRef,channelPropertyName);
            if (channelObjectRef !== null && channelObjectRef !== undefined) {

                if (performCacheReset) {
                    if (channelObjectRef.colorIsCached !== undefined && channelObjectRef.colorIsCached !==null) {
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

              

                if (channelObjectRef.color === null || channelObjectRef.color === undefined ) {
                   
                    channelObjectRef.color = [1,1,1];
                } 


                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (channelObjectRef.colorIsCached === undefined || channelObjectRef.colorIsCached === null) {
                   
                    channelObjectRef.colorIsCached = true;
                    channelObjectRef.colorCached = [];
                    channelObjectRef.colorCached[0] = channelObjectRef.color[0];
                    channelObjectRef.colorCached[1] = channelObjectRef.color[1];
                    channelObjectRef.colorCached[2] = channelObjectRef.color[2];                   


                }

                channelObjectRef.color[0] = classScope.srgbToLinear( parseInt(result[1], 16) / 255);
                channelObjectRef.color[1] = classScope.srgbToLinear(parseInt(result[2], 16) / 255);
                channelObjectRef.color[2] = classScope.srgbToLinear(parseInt(result[3], 16) / 255);
                classScope.api.setMaterial(materialObjectRef);

            }
        }       

    };

    this.resetColor = function (materialName, channelPropertyName) {
        classScope.setColor(materialName, channelPropertyName, "", true);

    };


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
}