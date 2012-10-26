function get3DScene() {
	$
			.ajax({
				type : 'POST',
				url : '/org.neuroml.visualiser/Get3DSceneServlet',
				data : {
					 url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/RIGL.nml"
					// url :"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/"
//				 url : "file:///Users/matteocantarelli/Documents/Development/neuroConstruct/osb/invertebrate/celegans/CElegansNeuroML/CElegans/generatedNeuroML2/"
				// url :"https://www.dropbox.com/s/ak4kn5t3c2okzoo/RIGL.nml?dl=1"

				},
				timeout : 1000000,
				success : function(data, textStatus) {
					jsonscene=data;
					init();
					animate();
				},
				error : function(xhr, textStatus, errorThrown) {
					alert("Error getting scene!" + textStatus + " ET "
							+ errorThrown);
				}
			});
}

$(document).ready(function() {
	get3DScene();
});

function getThreeObjectFromJSONGeometry(g, material) {
	var threeObject;
	switch (g.type) {
	case "Particle":
		break;
	case "Cylinder":
		var lookAtV = new THREE.Vector3(g.distal.x, g.distal.y, g.distal.z);
		var positionV = new THREE.Vector3(g.position.x, g.position.y,
				g.position.z);
		threeObject = getCylinder(positionV, lookAtV, g.radiusTop,
				g.radiusBottom, material);
		break;
	case "Sphere":
		threeObject = new THREE.Mesh(
				new THREE.SphereGeometry(g.radius, 10, 10), material);
		threeObject.position.set(g.position.x, g.position.y, g.position.z);
		break;
	}
	return threeObject;
}

function getCylinder(bottomBasePos, topBasePos, radiusTop, radiusBottom,
		material) {

	var cylinderAxis = new THREE.Vector3();
	cylinderAxis.sub(topBasePos, bottomBasePos);

	var cylHeight = cylinderAxis.length();

	var midPoint = new THREE.Vector3();
	midPoint.add(bottomBasePos, topBasePos);
	midPoint.multiplyScalar(0.5);

	var c = new THREE.CylinderGeometry(radiusTop, radiusBottom, cylHeight, 4,
			false);
	threeObject = new THREE.Mesh(c, material);

	lookAt(threeObject, cylinderAxis);
	threeObject.translate(midPoint.length(), midPoint);

	return threeObject;
}

// Orients an objetc obj so that it looks at a point in space
function lookAt(obj, point) {

	// Y Coordinate axis
	var yAxis = new THREE.Vector3(0, 1, 0);

	// Projection of the position vector on the XZ plane
	var projXZ = new THREE.Vector3();
	projXZ.sub(point, yAxis.multiplyScalar(point.dot(yAxis)));

	// Angle between the position vetor and the Y axis
	var phi = compPhi(point);

	// Angle between x axis and the projection of the position vector on the XZ
	// plane
	var theta = compTheta(projXZ);

	// Rotation matrix
	var transfMat = new THREE.Matrix4();
	transfMat.identity(); // initialize to identity

	transfMat.rotateY(theta); // multiply by rotation around Y by theta
	transfMat.rotateZ(phi); // multiply by rotation around Z by phy

	obj.rotation.setEulerFromRotationMatrix(transfMat); // apply the rotation to
	// the object
}

// Print a point coordinates on console
function printPoint(string, point) {
	console
			.log(string + " (" + point.x + ", " + point.y + ", " + point.z
					+ ")");
}

// Angle between x axis and the projection of the position vector on the XZ
// plane
function compTheta(proj) {
	var v = proj;

	v.normalize();

	var cos = v.x;

	var sign = v.x * v.z;

	var angle = Math.acos(cos);

	// Correct the fact that the reference system is right handed
	// and that acos returns only values between 0 and PI
	// ignoring angles in the third and fourth quadrant
	if (sign != 0) {
		if ((cos >= 0 && sign >= 0) || (cos < 0 && sign < 0))
			return -angle;
		else if (cos < 0 && sign >= 0)
			return (angle + Math.PI);
		else if (cos >= 0 && sign < 0)
			return angle;
	} else {
		if (v.z > 0 || v.x < 0) {
			return -angle;
		} else if (v.x >= 0 || v.z < 0) {
			return angle;
		}
	}
}

// Angle between the position vetor and the Y axis
function compPhi(point) {
	var v = point;
	v.normalize();

	var cos = v.y;
	var angle = Math.acos(cos);

	// Correction for right handed reference system and
	// acos return values
	if (point.x < 0 && point.z < 0)
		return angle;
	else
		return -angle
}

var projector, mouse = {
	x : 0,
	y : 0
}, INTERSECTED;
var keyboard = new THREEx.KeyboardState();

function getThreeSceneFromJSONScene() {
	scene = new THREE.Scene();

	var entities = jsonscene.entities;

	for ( var eindex in entities) {
		var geometries = entities[eindex].geometries;
		var entity = new THREE.Object3D();
		var material = new THREE.MeshLambertMaterial();
		material.color.setHex('0x'
				+ (Math.random() * 0xFFFFFF << 0).toString(16));

		for ( var gindex in geometries) {
			var threeObject = getThreeObjectFromJSONGeometry(
					geometries[gindex], material);
			threeObject.eindex=eindex;
			entity.add(threeObject);
		}
		scene.add(entity);
	}

	return scene;
}

function setupContainer()
{
	// create the container
	container = document.createElement('div');
	document.body.appendChild(container);
}

function setupScene()
{
	// The scene contains all the 3D object data.
	scene = getThreeSceneFromJSONScene(jsonscene);
}

function setupCamera()
{
	// Camera
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0, 150, 400);
	camera.lookAt(scene.position);
}

function setupControls()
{
	// Controls
	controls = new THREE.TrackballControls(camera);
	controls.rotateSpeed = 1.5;
	controls.zoomSpeed = 10;
	controls.panSpeed = 1;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0;
	controls.keys = [ 65, 83, 68 ];
	controls.addEventListener('change', render);
}

function setupStats()
{
	// Stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	projector = new THREE.Projector();
}

function setupLights()
{
	// Lights
	
	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	scene.add(light);
	light = new THREE.DirectionalLight(0x002288);
	light.position.set(-1, -1, -1);
	scene.add(light);
	light = new THREE.AmbientLight(0x222222);
	scene.add(light);
}

var metadata = 
{
		condDensity:"-",
		spikeThresh:"-",
		specificCapacitance:"-",
		initMembPotential:"-",
		resistivity:"-"
		
};

function setupGUI()
{
	// GUI
	gui = new dat.GUI();

	this.color1 = "#43ccee";
		this.color2="#88aa00";
	var folder1 = gui.addFolder('Membrane Properties');
	var condDensity = folder1.add(metadata, 'condDensity',color1 ).name('Condunctance density'); //channelDensity
	guiToUpdate.push(condDensity);
	var spikeThresh = folder1.add(metadata, 'spikeThresh',color1 ).name('Spike Threshold' );
	guiToUpdate.push(spikeThresh);
	var specificCapacitance = folder1.add(metadata, 'specificCapacitance',color1 ).name( 'Specific Capacitance' );
	guiToUpdate.push(specificCapacitance);
	var initMembPotential = folder1.add(metadata, 'initMembPotential',color1).name( 'Initial Membrane Potential' );
	guiToUpdate.push(initMembPotential);
	
	var folder2 = gui.addFolder('Intracellular Properties');
	var resistivity = folder2.add(metadata, 'resistivity',color2 ).name( 'Resistivity' );
	guiToUpdate.push(resistivity);
	folder1.open();
	folder2.open();
}

function setupRenderer()
{
	// and the CanvasRenderer figures out what the
	// stuff in the scene looks like and draws it!
	renderer = new THREE.WebGLRenderer({
		antialias : false
	});
	renderer.setSize(window.innerWidth, window.innerHeight);

	container.appendChild(renderer.domElement);
}

function setupAxis()
{
	// To use enter the axis length
	// scene.add(new THREE.AxisHelper(200));
}

function setupListeners()
{
	// when the mouse moves, call the given function
	document.addEventListener('mousemove', onDocumentMouseMove, false);
}

var camera, controls, scene, renderer,stats, gui;
var guiToUpdate=[];
var jsonscene;
var TOGGLE_Z = false;

//*********Init Function*********

function init() {
	setupScene();
	setupContainer();
	setupCamera();
	setupControls();
	setupLights();
	setupStats();
	setupGUI();
	setupRenderer();
	setupListeners();
};

function render() {
	renderer.render(scene, camera);
}

function onDocumentMouseMove(event) {
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	// event.preventDefault();

	// update the mouse variable
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
	requestAnimationFrame(animate);
	render();
	update();
}

function updateGUI(){
	for (var i in guiToUpdate) {
		guiToUpdate[i].updateDisplay();
	  }	
}

function update() {
	// find intersections

	// create a Ray with origin at the mouse position
	// and direction into the scene (camera direction)
	var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
	projector.unprojectVector(vector, camera);
	var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position)
			.normalize());

	// create an array containing all objects in the scene with which the ray
	// intersects
	var intersects = ray.intersectObjects(scene.children, true);

	// INTERSECTED = the object in the scene currently closest to the camera
	// and intersected by the Ray projected from the mouse position

	// if there is one (or more) intersections
	if (intersects.length > 0) {
		// if the closest object intersected is not the currently stored
		// intersection object
		if (intersects[0].object != INTERSECTED) {
			// restore previous intersection object (if it exists) to its
			// original color
			if (INTERSECTED)
				INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
			// store reference to closest object as current intersection object
			INTERSECTED = intersects[0].object;
			// store color of closest object (for later restoration)
			INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
			// set a new color for closest object
			INTERSECTED.material.color.setHex(0xffff00);
			
			//metadata=jsonscene.entities[INTERSECTED.eindex].metadata;
			newm=jsonscene.entities[INTERSECTED.eindex].metadata;
			 for(var key in metadata)
				 metadata[key] = newm[key];   
			updateGUI();
		}
	} else // there are no intersections
	{
		// restore previous intersection object (if it exists) to its original
		// color
		if (INTERSECTED)
			INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
		// remove previous intersection object reference
		// by setting current intersection object to "nothing"
		INTERSECTED = null;
	}

	if (keyboard.pressed("z")) {
		if (TOGGLE_Z) {
			THREE.SceneUtils.traverseHierarchy(scene, function(child) {
				if (child.hasOwnProperty("material")) {
					child.material.color.setHex(0xffff00);
				}
			}); 
		} else {
			THREE.SceneUtils.traverseHierarchy(scene, function(child) {
				if (child.hasOwnProperty("material")) {
					child.material.color.setHex(0xaaaaaa);
				}
			});
		}
		TOGGLE_Z = !TOGGLE_Z;

	}
	stats.update();
	controls.update();
}
