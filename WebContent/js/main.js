function get3DScene()
{
	$.ajax({
		type : 'POST',
		url : '/org.neuroml.visualiser/Get3DSceneServlet',
		data : {
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/RIGL.nml"
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/"
			url : "file:///Users/matteocantarelli/Documents/Development/neuroConstruct/osb/invertebrate/celegans/CElegansNeuroML/CElegans/generatedNeuroML2/celegans.nml"
		// url : "http://www.opensourcebrain.org/projects/cerebellarnucleusneuron/repository/revisions/master/show/NeuroML2"
		// url : "https://www.dropbox.com/s/ak4kn5t3c2okzoo/RIGL.nml?dl=1"
		// url :"http://www.opensourcebrain.org/projects/ca1pyramidalcell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"
		// url :"http://www.opensourcebrain.org/projects/thalamocortical/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/L23PyrRS.nml"
		// url :"http://www.opensourcebrain.org/projects/purkinjecell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"

		},
		timeout : 1000000,
		success : function(data, textStatus)
		{
			OW.init(createContainer(), data, update);
			OW.animate();
		},
		error : function(xhr, textStatus, errorThrown)
		{
			alert("Error getting scene!" + textStatus + " ET " + errorThrown);
		}
	});
}

var TOGGLE_N = true;
var TOGGLE_Z = false;
var TOGGLE_R = false;
var TOGGLE_S = false;

function createContainer()
{
	// create the container
	container = document.createElement('div');
	document.body.appendChild(container);
	return container;
}

$(document).ready(function()
{
	get3DScene();
});

var highlightMaterial = new THREE.MeshLambertMaterial({
	color : 0x666666,
	emissive : 0xff0000,
	ambient : 0x000000,
	shading : THREE.SmoothShading
});

var selectedMaterial = new THREE.MeshLambertMaterial({
	color : 0x666666,
	emissive : 0x00ff00,
	ambient : 0x000000,
	shading : THREE.SmoothShading
});

var connectedMaterial = new THREE.MeshLambertMaterial({
	color : 0xaaaaaa,
	emissive : 0xaaaaaa,
	ambient : 0x000000,
	shading : THREE.SmoothShading
});

var somaMaterial = new THREE.MeshLambertMaterial({
	color : 0x37abc8,
	emissive : 0x37abc8,
	ambient : 0x000000,
	shading : THREE.SmoothShading
});

var axonMaterial = new THREE.MeshLambertMaterial({
	color : 0xff6600,
	emissive : 0xff6600,
	ambient : 0x000000,
	shading : THREE.SmoothShading
});

var dendriteMaterial = new THREE.MeshLambertMaterial({
	color : 0x88aa00,
	emissive : 0x88aa00,
	ambient : 0x000000,
	shading : THREE.SmoothShading
});

var standardMaterial = new THREE.MeshLambertMaterial();
standardMaterial.color.setHex(0xaaaaaa);
standardMaterial.opacity = 0.4;

var INTERSECTED; // the object in the scene currently closest to the camera and intersected by the Ray projected from the mouse position
var SELECTED = [];
var REFERENCED = [];

var onClick = function(objectsClicked, button)
{
	if (button == 1)
	{
		if (TOGGLE_Z)
		{
			if (objectsClicked.length > 0)
			{
				var oldSelected = SELECTED;
				SELECTED = [];

				// we read the new object clicked
				if (objectsClicked[0].object.visible)
				{
					SELECTED.push(objectsClicked[0].object);

					// go ahead and do what described unless we clicked on the same entity
					// and we are in S mode in which case we don't want it to disappear
					if (OW.isIn(SELECTED[0], oldSelected))
					{
						// the object we clicked on was previously selected
						if (TOGGLE_S)
						{
							// do nothing we don't want everything to disappear
						}
						else
						{
							// 1)merge the entity
							// 2)change the color to all the referenced entities by the selected
							mergedEntity = OW.mergeEntities(oldSelected);
							mergedEntity.material = standardMaterial;
							SELECTED = [];
							for (r in REFERENCED)
							{
								REFERENCED[r].material = standardMaterial;
							}
							REFERENCED = [];
						}
					}
					else
					{
						// we clicked on a different object
						// 1)merge the entity
						// 2)make it invisible if S
						// 3)change the color to all the referenced entities by the selected
						// 4)make all references invisible if S
						if (oldSelected.length > 0)
						{
							mergedEntity = OW.mergeEntities(oldSelected);
							mergedEntity.material = standardMaterial;
							if (TOGGLE_S)
							{
								mergedEntity.visible = false;
							}

							for (r in REFERENCED)
							{
								REFERENCED[r].material = standardMaterial;
								if (TOGGLE_S)
								{
									REFERENCED[r].visible = false;
								}
							}
							REFERENCED = [];
						}
						// process new selection
						// 1)show metadata for what we clicked on
						// 2)decompose selected entity in subentities
						// 3)show references and change their material
						OW.showMetadataForEntity(SELECTED[0].eindex);
						REFERENCED = OW.getThreeReferencedObjectsFrom(SELECTED[0].eid);
						for (r in REFERENCED)
						{
							REFERENCED[r].material = connectedMaterial;
							REFERENCED[r].visible = true;
						}
						SELECTED = OW.divideEntity(SELECTED[0]);
						for (s in SELECTED)
						{
							if (SELECTED[s].eid.indexOf("soma_group") != -1)
							{
								SELECTED[s].material = somaMaterial;
							}
							else if (SELECTED[s].eid.indexOf("axon_group") != -1)
							{
								SELECTED[s].material = axonMaterial;
							}
							else if (SELECTED[s].eid.indexOf("dendrite_group") != -1)
							{
								SELECTED[s].material = dendriteMaterial;
							}
						}
					}
				}
			}
		}
	}
};

var update = function()
{
	// if we are in selection mode (Z) checks for intersections
	if (TOGGLE_Z && SELECTED.length == 0)
	{
		var intersects = OW.getIntersectedObjects();
		// if there is one (or more) intersections
		if (intersects.length > 0)
		{
			// if the closest object intersected is not the currently stored
			// intersection object
			if (intersects[0].object != INTERSECTED)
			{
				// restore previous intersection object (if it exists) to its
				// original material
				if (INTERSECTED)
					INTERSECTED.material = standardMaterial;
				// store reference to closest object as current intersection
				// object
				INTERSECTED = intersects[0].object;
				INTERSECTED.material = highlightMaterial;

				OW.showMetadataForEntity(INTERSECTED.eindex);
			}
		}
		else
		// there are no intersections
		{
			// restore previous intersection object (if it exists) to its
			// original material
			if (INTERSECTED)
			{
				INTERSECTED.material = standardMaterial;
			}
			// remove previous intersection object reference by setting current
			// intersection object to "nothing"
			INTERSECTED = null;
		}
	}
	// R enters rotation mode
	if (OW.isKeyPressed("r"))
	{
		if (TOGGLE_R)
		{
			TOGGLE_R = false;
			OW.exitRotationMode();
		}
		else
		{
			TOGGLE_R = true;
			OW.enterRotationMode(SELECTED);
		}
	}
	// Z enters selection mode
	if (OW.isKeyPressed("z") && !TOGGLE_Z)
	{

		TOGGLE_Z = true;
		TOGGLE_N = false;
		OW.setMouseClickListener(onClick);
		OW.renderer.setClearColorHex(0x000000, 1);
		THREE.SceneUtils.traverseHierarchy(OW.scene, function(child)
		{
			if (child.hasOwnProperty("material"))
			{
				child.material = standardMaterial;
			}
		});

	}
	// N exits selection mode and switches to standard view
	if (OW.isKeyPressed("n") && !TOGGLE_N)
	{
		TOGGLE_Z = false;
		TOGGLE_N = true;
		OW.removeMouseClickListener();
		if (OW.gui)
		{
			OW.gui.domElement.parentNode.removeChild(OW.gui.domElement);
			OW.gui = null;
		}
		if (SELECTED.length > 0)
		{
			// if anything was selected we merge the geometries again
			OW.mergeEntities(SELECTED);
			SELECTED = [];
		}
		OW.metadata = {};
		OW.renderer.setClearColorHex(0xffffff, 1);
		THREE.SceneUtils.traverseHierarchy(OW.scene, function(child)
		{
			if (child.hasOwnProperty("material"))
			{
				var material = new THREE.MeshLambertMaterial();
				material.color.setHex('0x' + (Math.random() * 0xFFFFFF << 0).toString(16));
				child.material = material;
				child.visible = true;
			}
		});

	}
	// S hides the non selected entities
	if (OW.isKeyPressed("s") && !TOGGLE_N && SELECTED.length > 0)
	{
		TOGGLE_S = !TOGGLE_S;
		THREE.SceneUtils.traverseHierarchy(OW.scene, function(child)
		{
			if (child.hasOwnProperty("material"))
			{
				if (!OW.isIn(child, SELECTED) && !OW.isIn(child, REFERENCED))
				{
					child.visible = !child.visible;
				}
			}
		});
	}
};
