Sketchfab API Utility Tutorial

If you plan to use the Sketchfab Viewer API on your websites I have created a utility that abstracts much of the coding required to do things like initialization, changing colors, toggling object visibility and loading textures. There are also detailed logs to the console when an error is made such as referencing materials, material channels or scene objects that do not exist.

The utility is an external javascript script file which you would include in your html page. You then create an instance of this object in a script on the page or in another javascript file of your own. This keeps your files clean and tidy for all your own coding.

Let’s get started :

To begin download the SketchfabAPIUtility file from Github :

https://github.com/shaderbytes/Sketchfab-Viewer-API-Utility

Then you need to include this script in your html page :

 <script src="SketchfabAPIUtility.js"></script>

You are still required to include the viewer api javascript as well :

<script type="text/javascript" src="https://gmskfstatic.test.edgekey.net/api/sketchfab-viewer-1.0.0.js"></script>

These are placed in your <head> tag and the order in which you include them does not matter.

Creating the instance

To use the Utility you need to create an instance of it. To do this you need to create a variable to reference your instance. You can name your variable whatever you like. For example going forward in this article, I will be using the name of the object but starting with a lowercase letter :

var sketchfabAPIUtility = new SketchfabAPIUtility();

This is referred to as a constructor. The above example is not passing any arguments in the constructor, and we do need to pass some arguments. Arguments are placed between the round brackets separated by a comma. Some arguments are mandatory for the Utility to  function correctly and some are not.

The Utility constructor has 4 arguments. The first three are mandatory and the last one is optional.
It is a common practice to denote optional arguments in code outline examples by putting square brackets around them. This is the full constructor definition :

SketchfabAPIUtility(urlIDRef, iframeRef, callbackRef, [clientInitObjectRef])

urlIDRef : A string value for your model URL.

iframeRef: A DOM object reference to the iframe of your sketchfab viewer embed.

callbackRef: Your user defined callback function to know when everything is loaded and ready.

clientInitObjectRef: Optional Javascript Object to pass in some Initialization values.
There is a default Initialization object which already  exists internally:

{  internal: 1, ui_infos: 0, ui_controls: 0, watermark: 1, continuousRender: 1, supersample: 0 }

So if you want to change any of these values you can simply pass in a object with any of these property names and your values and it will overwrite the internal default object.

Here is an example of the absolute minimal page setup required :

<!DOCTYPE HTML>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sketchfab Viewer API example</title>   
    <script src="SketchfabAPIUtility.js"></script>   
    <script type="text/javascript" src="https://gmskfstatic.test.edgekey.net/api/sketchfab-viewer-1.0.0.js"></script>
</head>

<body style="width:640px;margin:0 auto;">
   
    <iframe style="border:0" width="640" height="480" src="" id="api-frame" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>    

   
    <script type="text/javascript">

       
        function onSketchfabUtilityReady() {
            

        }
      

        var sketchfabAPIUtility = new SketchfabAPIUtility('90bfa90f0b114f36a588bd4c914a4519', document.getElementById('api-frame'), onSketchfabUtilityReady);       


    </script>
</body>
</html>


By the time your user defined callback is triggered the utility will have handled calling the Sketchfab client and viewer functions successfully and then also retrieved your models scene object and material object values and set them up for optimized retrieval and ease of use. If anything has gone wrong in this process the utility will log the errors to the browser console.



Using the Utility

The utility only abstracts functionality that is possible within the Sketchfab Viewer API Itself. I have not created an abstraction for every API function, only those where it made sense to do so. However, since the Sketchfab Viewer API object is stored within the utility itself, if you do want to call any functions on it directly you can. The property name for this is “api”.

For example, I have not wrapped the call to gotoAnnotation so if you wanted to call that method you would do it via the stored API reference like so:

 sketchfabAPIUtility.api.gotoAnnotation(annotationIndex);

Utility Functions

There are two groups of objects which we can reference in the Sketchfab API namely :

Materials
Scene Objects

Material names are self explanatory, these are imported with your model when uploading to Sketchfab. They are the same names you see in the Sketchfab editor. Material names are always unique as in you can not have two different materials with the same name.

Scene Objects are a bit more complex in how they are handled. For best results in manipulating your models via the API, you should make sure you give your scene objects useful names within your 3D application. This also means you should not use the OBJ format to export and upload your model as you will lose your intended naming convention and hierarchy. Scene Object names are not unique and under the hood your object may be split into multiple smaller objects if your vertices count exceeds the vertex limit per single object. (65536 vertices per mesh)

For convenience I have added code to output all the material names and all the scene object names when using the utility. For scene objects it will also differentiate between objects that share names. This is handy as a reference when doing your coding and once you have completed your work you can disable this logging by changing the internal “enableDebugLogging” variable to false. Currently it is set to true :

this.enableDebugLogging = true;

Lets begin with material functions. Nearly every function that deals with a material also requires you to pass in the channel to work upon. A channel is simply a group of properties for a single property. For example Diffuse is a single property, yet there are several properties within Diffuse you can set such as - texture, color and influence factor. Sketchfab has an expected name for each of these channels.

Again, for convenience, the utility has all these channel names defined for you already so you can reference them when dealing with a material function. These are all the channel names:

sketchfabAPIUtility.AOPBR
sketchfabAPIUtility.AlbedoPBR
sketchfabAPIUtility.BumpMap 
sketchfabAPIUtility.CavityPBR
sketchfabAPIUtility.DiffuseColor
sketchfabAPIUtility.DiffuseIntensity
sketchfabAPIUtility.DiffusePBR
sketchfabAPIUtility.EmitColor
sketchfabAPIUtility.GlossinessPBR
sketchfabAPIUtility.MetalnessPBR
sketchfabAPIUtility.NormalMap
sketchfabAPIUtility.Opacity 
sketchfabAPIUtility.RoughnessPBR
sketchfabAPIUtility.SpecularColor
sketchfabAPIUtility.SpecularF0
sketchfabAPIUtility.SpecularHardness
sketchfabAPIUtility.SpecularPBR

Functions for Materials

setColor(materialName, channelPropertyName, hex);
resetColor(materialName, channelPropertyName);

The required hex argument is a hexadecimal string value of the color to set.

example : 

sketchfabAPIUtility.setColor(“YourMaterialName”, sketchfabAPIUtility.DiffusePBR, “#FFFFFF”);

sketchfabAPIUtility.resetColor(“YourMaterialName”, sketchfabAPIUtility.DiffusePBR);


setFactor(materialName, channelPropertyName, factor);
resetFactor(materialName, channelPropertyName);

setAlpha(materialName, factor);
resetAlpha(materialName);

The required factor argument is a normalized decimal value 0.0 - 1.0

Example :

sketchfabAPIUtility.setFactor(“YourMaterialName”, sketchfabAPIUtility.NormalMap, 0.5);

sketchfabAPIUtility.resetFactor(“YourMaterialName”, sketchfabAPIUtility.NormalMap);

sketchfabAPIUtility.setAlpha(“YourMaterialName”, 0.5);

sketchfabAPIUtility.resetAlpha(“YourMaterialName”);

setAlpha is infact just a shortcut to calling setFactor, internally it is calling setFactor and passing the Opacity channel for you.


setTexture(materialName, channelPropertyName, url);
resetTexture(materialName, channelPropertyName);

The required URL argument should point to an image that is being served from a CORS enabled server or it will fail to load.

Example :

sketchfabAPIUtility.setTexture("YourMaterialName", sketchfabAPIUtility.AlbedoPBR, 'http://www.shaderbytes.co.za/sketchfab/development/api/examples/images/AlexVestin_Multicam.jpg');

There is an optional callback for image loading that is very useful. You simply have to define a function that receives one argument. The value passed to this argument would be the amount of images currently loading. You can decide how you want to handle this information yourself. Your function should then be set as the utilities “textureLoadedCallback” target.

Example :

function onSketchfabUtilityTextureLoad(loadCount) {
            if (loadCount > 0) {
                processTextureLoadDOMTarget.css("display", "block");
                processTextureLoadDOMTarget[0].innerHTML = "Loading " + loadCount + " textures";
            } else {
                processTextureLoadDOMTarget.css("display", "none");
            }
        }

sketchfabAPIUtility.textureLoadedCallback = onSketchfabUtilityTextureLoad;

Functions for Scene Objects

setNodeVisibility(nodeName, makeVisible,[nodeIndex]);
toggleNodeVisibility(nodeName,[nodeIndex]);

The required  “makeVisible” argument is a boolean value (true or false).
The optional  “nodeIndex” argument is an int value. This value only takes effect when referencing a nodeName that has multiple targets and you wish to affect only one of those targets. If nodeName has multiple targets and you do not pass in a value for nodeIndex, all targets with this name will be affected.

toggleNodeVisibility is the quickest means to handle object visibility as it will just toggle the visibility state on each call. By default all loaded nodes are visible, so the first call to this function would perform a hiding action. 

Example :

Handling single nodes or a complete array of nodes :
sketchfabAPIUtility.toggleNodeVisibility(“yourNodeName”);

Handling a specific node within an array :
sketchfabAPIUtility.toggleNodeVisibility(“yourNodeName”,yourNodeIntIndex);

setNodeVisibility is basically the same as above except you can explicitly set the visibility state.

Example :

Handling single nodes or a complete array of nodes :
sketchfabAPIUtility.toggleNodeVisibility(“yourNodeName”, yourBooleanValue);

Handling a specific node within an array :
sketchfabAPIUtility.toggleNodeVisibility(“yourNodeName”,yourBooleanValue,yourNodeIntIndex);

Discussion and Resources

This brings us to the end of this sketchfabAPIUtility introduction tutorial. If you have any questions concerning this API Utility you can post them in the Sketchfab forums on this thread :

https://forum.sketchfab.com/t/viewer-api-and-javascript-development/7748/40


Some example pages can be viewed here :

http://www.shaderbytes.co.za/sketchfab/development/api/examples/example_1.html
http://www.shaderbytes.co.za/sketchfab/development/api/examples/example_2.html
http://www.shaderbytes.co.za/sketchfab/development/api/examples/example_3.html
