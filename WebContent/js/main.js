function get3DScene()
{
	$("#controls").hide();
	$("#spinner").show();
	$.ajax({
		type : 'POST',
		url : '/org.neuroml.visualiser/Get3DSceneServlet',
		data : {
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/RIGL.nml"
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/"
			 url : "file:///Users/matteocantarelli/Documents/Development/neuroConstruct/osb/invertebrate/celegans/CElegansNeuroML/CElegans/generatedNeuroML2/celegans.nml"
			// url : "http://www.opensourcebrain.org/projects/cerebellarnucleusneuron/repository/revisions/master/show/NeuroML2"
			// url : "https://www.dropbox.com/s/ak4kn5t3c2okzoo/RIGL.nml?dl=1"
//			url : "http://www.opensourcebrain.org/projects/ca1pyramidalcell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"
		// url :"http://www.opensourcebrain.org/projects/thalamocortical/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/L23PyrRS.nml"
		// url :"http://www.opensourcebrain.org/projects/purkinjecell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"

		},
		timeout : 1000000,
		success : function(data, textStatus)
		{
			setupUI();
			preprocessMetadata(data);
			OW.init(createContainer(), data, update);
			OW.animate();
			document.addEventListener("keydown", keyPressed, false);
			$("#controls").show();
			$("#spinner").hide();
		},
		error : function(xhr, textStatus, errorThrown)
		{
			alert("Error getting scene!" + textStatus + " ET " + errorThrown);
		}
	});
}

function createContainer()
{
	return document.getElementById('content');
}

$(document).ready(function()
{
	get3DScene();
});

var highlightMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0xff0000,
	shading : THREE.SmoothShading
});

var preConnectedMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x334000,
	shading : THREE.SmoothShading
});

var postConnectedMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x682a00,
	shading : THREE.SmoothShading
});

var prePostConnectedMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0xffffff,
	shading : THREE.SmoothShading
});

var somaMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x37abc8,
	shading : THREE.SmoothShading
});

var axonMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0xff6600,
	shading : THREE.SmoothShading
});

var dendriteMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x88aa00,
	shading : THREE.SmoothShading
});

var standardMaterial = new THREE.MeshPhongMaterial({
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	shading : THREE.SmoothShading
});
standardMaterial.color.setHex(0xaaaaaa);
standardMaterial.opacity = 0.4;

var INTERSECTED; // the object in the scene currently closest to the camera and intersected by the Ray projected from the mouse position
var SELECTED = [];
var REFERENCED = [];
var INPUT = [];
var OUTPUT = [];

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
							INPUT = [];
							OUTPUT = [];
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
							INPUT = [];
							OUTPUT = [];
						}
						// process new selection
						// 1)show metadata for what we clicked on
						// 2)decompose selected entity in subentities
						// 3)show references and change their material
						OW.showMetadataForEntity(SELECTED[0].eindex);

						var entity = OW.getJSONEntityFromId(SELECTED[0].eid);
						var preIDs = [];
						var postIDs = [];
						if (entity.metadata.hasOwnProperty("Connections"))
						{
							if (entity.metadata["Connections"].hasOwnProperty("Input"))
							{
								preIDs = Object.keys(entity.metadata["Connections"]["Input"]);
							}
							if (entity.metadata["Connections"].hasOwnProperty("Output"))
							{
								postIDs = Object.keys(entity.metadata["Connections"]["Output"]);
							}

							THREE.SceneUtils.traverseHierarchy(OW.scene, function(child)
							{
								if (child.hasOwnProperty("eid"))
								{
									if (TOGGLE_I && OW.isIn(child.eid, preIDs))
									{
										REFERENCED.push(child);
										INPUT.push(child);
										child.material = preConnectedMaterial;
										child.visible = true;
									}
									if (TOGGLE_O && OW.isIn(child.eid, postIDs))
									{
										REFERENCED.push(child);
										OUTPUT.push(child);
										child.material = postConnectedMaterial;
										child.visible = true;
									}
									if (TOGGLE_I && TOGGLE_O && OW.isIn(child.eid, postIDs) && OW.isIn(child.eid, preIDs))
									{
										REFERENCED.push(child);
										child.material = prePostConnectedMaterial;
										child.visible = true;
									}

								}
							});
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

var preprocessMetadata = function(data)
{
	for (d in data.entities)
	{
		var m = data.entities[d];
		var mcon = m.metadata["Connections"] = {};
		for (r in m.references)
		{
			var connectionType = m.references[r].metadata["Connection Type"];
			delete m.references[r].metadata["Connection Type"];
			if (!mcon[connectionType])
			{
				mcon[connectionType] = {};
			}
			mcon[connectionType][m.references[r].entityId] = m.references[r].metadata;
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

};

var TOGGLE_N = true;
var TOGGLE_Z = false;
var TOGGLE_R = false;
var TOGGLE_S = false;
var TOGGLE_I = true;
var TOGGLE_O = true;

function toggleRotationMode()
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

function toggleOutputs()
{
	TOGGLE_O = !TOGGLE_O;
	for (o in OUTPUT)
	{
		var refMaterial = postConnectedMaterial;
		if (TOGGLE_S)
		{
			OUTPUT[o].visible = TOGGLE_O;
		}
		if (TOGGLE_I && OW.isIn(OUTPUT[o], INPUT))
		{
			refMaterial = prePostConnectedMaterial;

		}
		OUTPUT[o].material = TOGGLE_O ? refMaterial : standardMaterial;
	}

}

function toggleInputs()
{
	TOGGLE_I = !TOGGLE_I;
	for (i in INPUT)
	{
		var refMaterial = preConnectedMaterial;
		if (TOGGLE_S)
		{
			INPUT[i].visible = TOGGLE_I;
		}
		if (TOGGLE_O && OW.isIn(INPUT[i], OUTPUT))
		{
			refMaterial = prePostConnectedMaterial;
		}
		INPUT[i].material = TOGGLE_I ? refMaterial : standardMaterial;
	}
}

function toggleNormalMode()
{
	if (!TOGGLE_N)
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
				var material = new THREE.MeshPhongMaterial({
					opacity : 1,
					ambient : 0x777777,
					specular : 0xbbbb9b,
					shininess : 2,
					shading : THREE.SmoothShading
				});
				material.color.setHex('0x' + (Math.random() * 0xFFFFFF << 0).toString(16));
				child.material = material;
				child.visible = true;
			}
		});
	}
}

function toggleSelectionMode()
{
	if (!TOGGLE_Z)
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
	;
}

function toggleHideNonSelected()
{
	if (!TOGGLE_N && SELECTED.length > 0)
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
}

function keyPressed()
{
	// R enters rotation mode
	if (OW.isKeyPressed("r"))
	{
		toggleRotationMode();
	}
	// I shows/hides inputs
	if (OW.isKeyPressed("i"))
	{
		toggleInputs();
	}
	// O shows/hides outputs
	if (OW.isKeyPressed("o"))
	{
		toggleOutputs();
	}
	// Z enters selection mode
	if (OW.isKeyPressed("z"))
	{
		toggleSelectionMode();
	}
	// N exits selection mode and switches to standard view
	if (OW.isKeyPressed("n") && !TOGGLE_N)
	{
		toggleNormalMode();
	}
	// S hides the non selected entities
	if (OW.isKeyPressed("s"))
	{
		toggleHideNonSelected();
	}
	if (OW.isKeyPressed("w"))
	{
		window.open( OW.renderer.domElement.toDataURL( 'image/png' ), 'screenshot' );
	}
	
	if (OW.isKeyPressed("h"))
	{
		OW.camera.position.x = OW.camera.position.x +10;
	}
	if (OW.isKeyPressed("j"))
	{
		OW.camera.position.x = OW.camera.position.x -10;
	}
	if (OW.isKeyPressed("y"))
	{
		OW.camera.position.z = OW.camera.position.z +10;
	}
	if (OW.isKeyPressed("n"))
	{
		OW.camera.position.z = OW.camera.position.z -10;
	}
	if (OW.isKeyPressed("b"))
	{
		OW.camera.position.y = OW.camera.position.y +10;
	}
	if (OW.isKeyPressed("m"))
	{
		OW.camera.position.y = OW.camera.position.y -10;
	}
}

function setupUI()
{
	$(function()
	{
		$("button:first").button({
			icons : {
				primary : "ui-icon-triangle-1-w"
			},
			text : false
		}).next().button({
			icons : {
				primary : "ui-icon-triangle-1-n"
			},
			text : false
		}).next().button({
			icons : {
				primary : "ui-icon-triangle-1-e"
			},
			text : false
		}).next().button({
			icons : {
				primary : "ui-icon-triangle-1-s"
			},
			text : false
		}).next().button({
			icons : {
				primary : "ui-icon-home"
			},
			text : false
		});

		$("#showinputs").button({
			icons : {
				primary : "ui-icon-arrowthick-1-s"
			},
			text : false
		}).click(function(event)
		{
			toggleInputs();
		});
		;
		$("#showoutputs").button({
			icons : {
				primary : "ui-icon-arrowthick-1-n"
			},
			text : false
		}).click(function(event)
		{
			toggleOutputs();
		});
		;
		$("#rotationmode").button({
			icons : {
				primary : "ui-icon-arrowrefresh-1-s"
			},
			text : false
		}).click(function(event)
		{
			toggleRotationMode();
		});
		;
		$("#io").buttonset();
		$("#normalMode").click(function(event)
		{
			toggleNormalMode();
		});
		$("#selectionMode").click(function(event)
		{
			toggleSelectionMode();
		});
		$("#mode").buttonset();
	});

}