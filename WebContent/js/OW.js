/**
 * @fileoverview Visualization engine built on top of THREE.js. Displays
 * a scene as defined on org.openworm.simulationengine.core
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 */

/**
 * Base class
 */
var OW = OW || {};

/**
 * Global variables
 */
OW.camera = null;
OW.container=null;
OW.controls = null;
OW.scene = null;
OW.renderer = null;
OW.stat = null;
OW.gui = null;
OW.projector = null;
OW.keyboard = new THREEx.KeyboardState();
OW.guiToUpdate = [];
OW.jsonscene = null;
OW.metadata = {};
OW.customUpdate=null;
OW.mouse = {
	x : 0,
	y : 0
};

/**
 * Initialize the engine
 */
OW.init = function(containerp,jsonscenep,updatep)
{
	OW.container=containerp;
	OW.jsonscene = jsonscenep;
	OW.customUpdate=update;
	OW.setupScene();
	OW.setupCamera();
	OW.setupControls();
	OW.setupLights();
	OW.setupStats();
	OW.setupRenderer();
	OW.setupListeners();
};

/**
 * Creates a geometry according to its type
 * 
 * @param g
 * @param material
 * @returns a three mesh representing the geometry
 */
OW.getThreeObjectFromJSONGeometry = function(g, material)
{
	var threeObject = null;
	switch (g.type)
	{
	case "Particle":
		break;
	case "Cylinder":
		var lookAtV = new THREE.Vector3(g.distal.x, g.distal.y, g.distal.z);
		var positionV = new THREE.Vector3(g.position.x, g.position.y, g.position.z);
		threeObject = OW.getCylinder(positionV, lookAtV, g.radiusTop, g.radiusBottom, material);
		break;
	case "Sphere":
		threeObject = new THREE.Mesh(new THREE.SphereGeometry(g.radius, 10, 10), material);
		threeObject.position.set(g.position.x, g.position.y, g.position.z);
		break;
	}
	return threeObject;
};

/**
 * Creates a cylinder
 * 
 * @param bottomBasePos
 * @param topBasePos
 * @param radiusTop
 * @param radiusBottom
 * @param material
 * @returns a Cylinder translated and rotated in the scene according to the
 *          cartesian coordinated that describe it
 */
OW.getCylinder = function(bottomBasePos, topBasePos, radiusTop, radiusBottom, material)
{
	var cylinderAxis = new THREE.Vector3();
	cylinderAxis.sub(topBasePos, bottomBasePos);

	var cylHeight = cylinderAxis.length();

	var midPoint = new THREE.Vector3();
	midPoint.add(bottomBasePos, topBasePos);
	midPoint.multiplyScalar(0.5);

	var c = new THREE.CylinderGeometry(radiusTop, radiusBottom, cylHeight, 5, false);
	threeObject = new THREE.Mesh(c, material);

	OW.lookAt(threeObject, cylinderAxis);
	threeObject.translate(midPoint.length(), midPoint);

	return threeObject;
};

/**
 * Orients an object obj so that it looks at a point in space
 * 
 * @param obj
 * @param point
 */
OW.lookAt = function(obj, point)
{

	// Y Coordinate axis
	var yAxis = new THREE.Vector3(0, 1, 0);

	// Projection of the position vector on the XZ plane
	var projXZ = new THREE.Vector3();
	projXZ.sub(point, yAxis.multiplyScalar(point.dot(yAxis)));

	// Angle between the position vetor and the Y axis
	var phi = OW.compPhi(point);

	// Angle between x axis and the projection of the position vector on the XZ
	// plane
	var theta = OW.compTheta(projXZ);

	// Rotation matrix
	var transfMat = new THREE.Matrix4();
	transfMat.identity(); // initialize to identity

	transfMat.rotateY(theta); // multiply by rotation around Y by theta
	transfMat.rotateZ(phi); // multiply by rotation around Z by phy

	obj.rotation.setEulerFromRotationMatrix(transfMat); // apply the rotation to
	// the object
};

/**
 * Print a point coordinates on console
 * 
 * @param string
 * @param point
 */
OW.printPoint = function(string, point)
{
	console.log(string + " (" + point.x + ", " + point.y + ", " + point.z + ")");
};

/**
 * 
 * @param proj
 * @returns Angle between x axis and the projection of the position vector on
 *          the XZ plane
 */
OW.compTheta = function(proj)
{
	var v = proj;

	v.normalize();

	var cos = v.x;

	var sign = v.x * v.z;

	var angle = Math.acos(cos);

	// Correct the fact that the reference system is right handed
	// and that acos returns only values between 0 and PI
	// ignoring angles in the third and fourth quadrant
	if (sign != 0)
	{
		if ((cos >= 0 && sign >= 0) || (cos < 0 && sign < 0))
			return -angle;
		else if (cos < 0 && sign >= 0)
			return (angle + Math.PI);
		else if (cos >= 0 && sign < 0)
			return angle;
	}
	else
	{
		if (v.z > 0 || v.x < 0)
		{
			return -angle;
		}
		else if (v.x >= 0 || v.z < 0)
		{
			return angle;
		}
	}
};

/**
 * @param point
 * @returns Angle between the position vetor and the Y axis
 */
OW.compPhi = function(point)
{
	var v = point;
	v.normalize();

	var cos = v.y;
	var angle = Math.acos(cos);

	// Correction for right handed reference system and
	// acos return values
	if (point.x < 0 && point.z < 0)
		return angle;
	else
		return -angle;
};

/**
 * @returns
 */
OW.setupScene = function()
{
	OW.scene = new THREE.Scene();

	var entities = OW.jsonscene.entities;

	for ( var eindex in entities)
	{
		var geometries = entities[eindex].geometries;

		var material = new THREE.MeshLambertMaterial();
		material.color.setHex('0x' + (Math.random() * 0xFFFFFF << 0).toString(16));
		var combined = new THREE.Geometry();
		for ( var gindex in geometries)
		{
			var threeObject = OW.getThreeObjectFromJSONGeometry(geometries[gindex], material);
			THREE.GeometryUtils.merge(combined, threeObject);
		}
		var entityMesh = new THREE.Mesh(combined, material);
		OW.scene.add(entityMesh);
		entityMesh.eindex = eindex;
		OW.scene.add(entityMesh);
	}
};

/**
 * 
 */
OW.setupCamera = function()
{
	// Camera
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	OW.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	OW.scene.add(OW.camera);
	OW.camera.position.set(0, 150, 400);
	OW.camera.lookAt(OW.scene.position);
};

/**
 * 
 */
OW.setupControls = function()
{
	// Controls
	OW.controls = new THREE.TrackballControls(OW.camera);
	OW.controls.rotateSpeed = 1.5;
	OW.controls.zoomSpeed = 10;
	OW.controls.panSpeed = 1;
	OW.controls.noZoom = false;
	OW.controls.noPan = false;
	OW.controls.staticMoving = true;
	OW.controls.dynamicDampingFactor = 0;
	OW.controls.keys = [ 65, 83, 68 ];
	OW.controls.addEventListener('change', OW.render);
};

/**
 * 
 */
OW.setupStats = function()
{
	// Stats
	OW.stats = new Stats();
	OW.stats.domElement.style.position = 'absolute';
	OW.stats.domElement.style.bottom = '0px';
	OW.stats.domElement.style.zIndex = 100;
	OW.container.appendChild(OW.stats.domElement);
	OW.projector = new THREE.Projector();
};

/**
 * 
 */
OW.setupLights = function()
{
	// Lights

	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	OW.scene.add(light);
	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(-1, -1, -1);
	OW.scene.add(light);
	light = new THREE.AmbientLight(0x222222);
	OW.scene.add(light);
};

/**
 * Create a GUI element based on the available metadata
 */
OW.setupGUI = function()
{
	var data = false;
	for ( var m in OW.metadata)
	{
		data = true;
		break;
	}

	// GUI
	if (!OW.gui && data)
	{
		OW.gui = new dat.GUI();
		OW.addGUIControls(OW.gui,OW.metadata);
	}

};

/**
 * Updates the GUI controls
 */
OW.updateGUI = function()
{
	for ( var i in OW.guiToUpdate)
	{
		guiToUpdate[i].updateDisplay();
	}
};

/**
 * @param gui
 * @param metadatap
 */
OW.addGUIControls = function(parent,current_metadata)
{
	if (current_metadata.hasOwnProperty("ID"))
	{
		OW.gui.add(current_metadata, "ID").listen();
	}
	for ( var m in current_metadata)
	{
		if (m != "ID")
		{
			if (typeof current_metadata[m] == "object")
			{
				folder = OW.gui.addFolder(m);
				//recursive call to populate the GUI with sub-metadata
				OW.addGUIControls(folder, current_metadata[m]);
				folder.open();
			}
			else
			{
				parent.add(current_metadata, m).listen();
			}
		}
	}
};

/**
 * This method updates the available metadata. This method is required since to
 * update a GUI element we have to overwrite the properties in the same object
 * without changing the object itself.
 * 
 * @param metadatatoupdate
 * @param metadatanew
 */
OW.updateMetaData = function(metadatatoupdate, metadatanew)
{
	for ( var m in metadatanew)
	{
		if (typeof metadatanew[m] == "object")
		{
			OW.updateMetaData(metadatatoupdate[m], metadatanew[m]);
		}
		else
		{
			metadatatoupdate[m] = metadatanew[m];
		}
	}
};

/**
 * 
 */
OW.setupRenderer = function()
{
	// and the CanvasRenderer figures out what the
	// stuff in the scene looks like and draws it!
	OW.renderer = new THREE.WebGLRenderer({
		antialias : true
	});
	OW.renderer.setSize(window.innerWidth, window.innerHeight);

	OW.container.appendChild(OW.renderer.domElement);
};

/**
 * Adds debug axis to the scene
 */
OW.setupAxis = function()
{
	// To use enter the axis length
	OW.scene.add(new THREE.AxisHelper(200));
};

/**
 * 
 */
OW.setupListeners = function()
{
	// when the mouse moves, call the given function
	document.addEventListener('mousemove', OW.onDocumentMouseMove, false);
};

/**
 * 
 */
OW.render = function()
{
	OW.renderer.render(OW.scene, OW.camera);
};

/**
 * We store the mouse coordinates
 * 
 * @param event
 */
OW.onDocumentMouseMove = function(event)
{
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	// event.preventDefault();

	// update the mouse variable
	OW.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	OW.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

/**
 * @returns a list of objects intersected by the current mouse coordinates
 */
OW.getIntersectedObjects = function()
{
	// create a Ray with origin at the mouse position and direction into the
	// scene (camera direction)
	var vector = new THREE.Vector3(OW.mouse.x,OW.mouse.y, 1);
	OW.projector.unprojectVector(vector, OW.camera);
	var ray = new THREE.Ray(OW.camera.position, vector.subSelf(OW.camera.position).normalize());

	// returns an array containing all objects in the scene with which the ray
	// intersects
	return ray.intersectObjects(OW.scene.children, true);
};

/**
 * @param key
 *            the pressed key
 * @returns true if the key is pressed
 */
OW.isKeyPressed = function(key)
{
	return OW.keyboard.pressed(key);
};

/**
 * @param entityIndex
 *            the id of the entity for which we want to display metadata
 */
OW.showMetadataForEntity = function(entityIndex)
{
	if (!OW.gui)
	{
		OW.metadata = OW.jsonscene.entities[entityIndex].metadata;
		OW.setupGUI();
	}
	else
	{
		OW.updateMetaData(OW.metadata, OW.jsonscene.entities[entityIndex].metadata);
		OW.updateGUI();
	}
};


/**
 * 
 */
OW.animate = function()
{
	requestAnimationFrame(OW.animate);
	OW.render();
	OW.customUpdate();
	OW.stats.update();
	OW.controls.update();
};
