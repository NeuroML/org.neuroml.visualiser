function get3DScene()
{
	$.ajax({
		type : 'POST',
		url : '/org.neuroml.visualiser/Get3DSceneServlet',
		data : {
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/RIGL.nml"
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/"
			url : "file:///Users/matteocantarelli/Documents/Development/neuroConstruct/osb/invertebrate/celegans/CElegansNeuroML/CElegans/generatedNeuroML2/"
		// url :
		// "http://www.opensourcebrain.org/projects/cerebellarnucleusneuron/repository/revisions/master/show/NeuroML2"
		// url :"https://www.dropbox.com/s/ak4kn5t3c2okzoo/RIGL.nml?dl=1"
		// url
		// :"http://www.opensourcebrain.org/projects/ca1pyramidalcell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"
		// url:"http://www.opensourcebrain.org/projects/thalamocortical/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/L23PyrRS.nml"
		// url:"http://www.opensourcebrain.org/projects/purkinjecell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"

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
var INTERSECTED; // the object in the scene currently closest to the
var SELECTED = [];
// camera
// and intersected by the Ray projected from the mouse position

var onClick = function(objectsClicked, button)
{
	if (button == 1)
	{
		if (TOGGLE_Z)
		{
			if (objectsClicked.length > 0)
			{
				var oldSelected = [];
				if (SELECTED.length > 0)
				{
					oldSelected = SELECTED;
					mergedEntity = OW.mergeEntities(SELECTED);
					mergedEntity.material = standardMaterial;
				}
				SELECTED = objectsClicked[0].object;
				if (SELECTED)
				{
					if (isIn(SELECTED, oldSelected))
					{
						SELECTED = [];
					}
					else
					{
						OW.showMetadataForEntity(SELECTED.eindex);
						SELECTED = OW.divideEntity(SELECTED);
						for (s in SELECTED)
						{
							if (SELECTED[s].eid.indexOf("soma_group") != -1)
							{
								SELECTED[s].material=somaMaterial;
							}
							else if (SELECTED[s].eid.indexOf("axon_group") != -1)
							{
								SELECTED[s].material=axonMaterial;
							}
							else if (SELECTED[s].eid.indexOf("dendrite_group") != -1)
							{
								SELECTED[s].material=dendriteMaterial;
							}
						}
					}
				}
			}
		}
	}
};

function isIn(e, array)
{
	var found = false;
	for ( var i = 0; i < array.length; i++)
	{
		if (array[i] == e)
		{
			found = true;
			break;
		}
	}
	return found;
}
var update = function()
{
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
			}
		});

	}
};
