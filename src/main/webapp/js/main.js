function get3DScene(neuromlurl)
{
	$("#controls").hide();
	$("#error").hide();
	$("#loadinglbl").show();
	$.ajax(
	{
		type : 'POST',
		url : '/org.neuroml.visualiser/Get3DSceneServlet',
		data :
		{
			// url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/RIGL.nml"
			// url : "https://raw.github.com/openworm/CElegansNeuroML/master/CElegans/generatedNeuroML2/CElegans.net.nml"
			// url : "file:///Users/matteocantarelli/Documents/Development/neuroConstruct/osb/invertebrate/celegans/CElegansNeuroML/CElegans/generatedNeuroML2/celegans.nml"
			// url : "http://www.opensourcebrain.org/projects/cerebellarnucleusneuron/repository/revisions/master/show/NeuroML2"
			// url : "https://www.dropbox.com/s/ak4kn5t3c2okzoo/RIGL.nml?dl=1"
			// url : "http://www.opensourcebrain.org/projects/ca1pyramidalcell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/"
			// url :"http://www.opensourcebrain.org/projects/thalamocortical/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/L23PyrRS.nml"
			// url : "http://www.opensourcebrain.org/projects/purkinjecell/repository/revisions/master/raw/neuroConstruct/generatedNeuroML2/purk2.nml"
			// url:"file:///Users/matteocantarelli/Desktop/sample.nml"
			url : neuromlurl
		},
		timeout : 9000000,
		success : function(data, textStatus)
		{
			if (data.length === 0 || data.entities.length === 0)
			{
				$("#loadinglbl").hide();
				$("#error").modal();
			}
			else
			{
				preprocessMetadata(data);
				if (GEPPETTO.init(createContainer(), update))
				{
					GEPPETTO.setBackground(0xFFFFFF, 1);
					if (!GEPPETTO.isScenePopulated())
					{
						// the first time we need to create the object.s
						GEPPETTO.populateScene(data);
					}
					else
					{
						// any other time we just update them
						GEPPETTO.updateJSONScene(data);
					}
					GEPPETTO.animate();
					document.addEventListener("keydown", keyPressed, false);
					$("#controls").show();
					$("#loadinglbl").hide();
				}
				else
				{
					// initialisation failed
					$("#loadinglbl").hide();
				}
			}

		},
		error : function(xhr, textStatus, errorThrown)
		{
			$("#loadinglbl").hide();
			$("#error").modal();
		}
	});
}

function createContainer()
{
	return document.getElementById('content');
}

$(document).ready(function()
{
	if (typeof String.prototype.startsWith != 'function')
	{
		// see below for better implementation!
		String.prototype.startsWith = function(str)
		{
			return this.indexOf(str) == 0;
		};
	}
	setupUI();
	vars = getUrlVars();
	get3DScene(decodeURIComponent(vars.url));
});

var highlightMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xff0000,
	shininess : 20,
	color : 0xff0000,
	shading : THREE.SmoothShading
});

var zeroDensityMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0xffffff,
	specular : 0xffffff,
	shininess : 50,
	color : 0xffffff,
	shading : THREE.SmoothShading
});

var preConnectedMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x334000,
	shading : THREE.SmoothShading
});

var postConnectedMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x682a00,
	shading : THREE.SmoothShading
});

var prePostConnectedMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0xffffff,
	shading : THREE.SmoothShading
});

var somaMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x37abc8,
	shading : THREE.SmoothShading
});

var axonMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0xff6600,
	shading : THREE.SmoothShading
});

var dendriteMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 1,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	color : 0x88aa00,
	shading : THREE.SmoothShading
});

var standardMaterial = new THREE.MeshPhongMaterial(
{
	opacity : 0.5,
	ambient : 0x777777,
	specular : 0xbbbb9b,
	shininess : 50,
	transparent : true,
	shading : THREE.SmoothShading,
	color : 0xaaaaaa
});

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

				// we read the new object clicked
				if (objectsClicked[0].object.visible)
				{
					SELECTED = [];
					SELECTED.push(objectsClicked[0].object);

					// go ahead and do what described unless we clicked on the same entity
					// and we are in S mode in which case we don't want it to disappear
					if (GEPPETTO.isIn(SELECTED[0], oldSelected))
					{
						// the object we clicked on was previously selected
						if (TOGGLE_S || singleEntity())
						{
							// do nothing else we don't want everything to disappear
						}
						else
						{
							// 1)merge the entity
							// 2)change the color to all the referenced entities by the selected
							mergedEntity = GEPPETTO.mergeEntities(oldSelected);
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
						deselectSelection();
						// we clicked on a different object
						// 1)merge the entity
						// 2)make it invisible if S
						// 3)change the color to all the referenced entities by the selected
						// 4)make all references invisible if S
						if (oldSelected.length > 0)
						{
							mergedEntity = GEPPETTO.mergeEntities(oldSelected);
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
						GEPPETTO.showMetadataForEntity(SELECTED[0].eindex);

						$("li:contains('Connections').title").append(" <icon class='icon-signin'></icon> <icon class='icon-signout'></icon>");
						
						var entity = GEPPETTO.getJSONEntityFromId(SELECTED[0].eid);
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

							GEPPETTO.getScene().traverse(function(child)
							{
								if (child.hasOwnProperty("eid"))
								{
									if (TOGGLE_I && GEPPETTO.isIn(child.eid, preIDs))
									{
										REFERENCED.push(child);
										INPUT.push(child);
										child.material = preConnectedMaterial;
										child.visible = true;
									}
									if (TOGGLE_O && GEPPETTO.isIn(child.eid, postIDs))
									{
										REFERENCED.push(child);
										OUTPUT.push(child);
										child.material = postConnectedMaterial;
										child.visible = true;
									}
									if (TOGGLE_I && TOGGLE_O && GEPPETTO.isIn(child.eid, postIDs) && GEPPETTO.isIn(child.eid, preIDs))
									{
										REFERENCED.push(child);
										child.material = prePostConnectedMaterial;
										child.visible = true;
									}

								}
							});
						}
						SELECTED = GEPPETTO.divideEntity(SELECTED[0]);
						for (s in SELECTED)
						{
							if (SELECTED[s].segment_groups.indexOf("soma_group") != -1)
							{
								SELECTED[s].material = somaMaterial;
							}
							else if (SELECTED[s].segment_groups.indexOf("axon_group") != -1)
							{
								SELECTED[s].material = axonMaterial;
							}
							else if (SELECTED[s].segment_groups.indexOf("dendrite_group") != -1)
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

var highlightChannelDensity = function(value)
{
	if (subGroupHighlighted == value)
	{
		clearSubgroup();
	}
	else
	{
		var allDensities = [];
		var allSubGroups = [];
		$("li:contains('" + value + "_').title ~ li.cr.string").each(function()
		{
			var that = $(this);
			that.find("div:contains('Passive conductance') > div > input").each(function()
			{
				allDensities.push(jQuery(this).val().substring(0, jQuery(this).val().indexOf(" ")).trim());
			});
			that.find("div > span:contains('Location')  ~ div > input").each(function()
			{
				allSubGroups.push(jQuery(this).val());
			});
		});
		var densityMap = new Object();
		var alli = -1;
		for ( var i = 0; i < allDensities.length; i++)
		{
			if (allSubGroups[i] != "all")
			{
				densityMap[allSubGroups[i]] = allDensities[i];
			}
			else
			{
				alli = i;
			}
		}
		if (alli != -1)
		{
			allDensities.splice(alli, 1);
			allSubGroups.splice(alli, 1);
		}
		var minDensity = Math.min.apply(null, allDensities);
		var maxDensity = Math.max.apply(null, allDensities);
		GEPPETTO.getScene().traverse(function(child)
		{
			child.material = zeroDensityMaterial;
			if (child.hasOwnProperty("segment_groups"))
			{
				for ( var sg in allSubGroups)
				{
					if (allSubGroups[sg] != "all")
					{
						//let's check if the cell is in the subgroup 
						if (child.segment_groups.indexOf(allSubGroups[sg] + ";") != -1)
						{
							var intensity = (densityMap[allSubGroups[sg]] - minDensity) / (maxDensity - minDensity);
							
							var dMaterial = new THREE.MeshPhongMaterial(
									{
										opacity : 1,
										ambient : 0x777777,
										specular : 0xbbbb9b,
										shininess : 50,
										color : rgbToHex(255,Math.floor(255 - (255 * intensity)),0),
										shading : THREE.SmoothShading
									});

							child.material = dMaterial;
							child.visible = true;
							break;
						}
					}
				}
			}
		});
		subGroupHighlighted = value;
		$("li:contains(" + value + "_).title").css("text-decoration", "underline").css("color", "#FF6600");
	}
};

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

var selectGeometriesInSubgroup = function(subGroup)
{
	if (subGroupHighlighted == subGroup)
	{
		clearSubgroup();
	}
	else
	{
		clearSubgroup();
		GEPPETTO.getScene().traverse(function(child)
		{
			if (child.hasOwnProperty("segment_groups"))
			{
				if (child.segment_groups.indexOf(subGroup + ";") != -1)
				{

					child.material = highlightMaterial;
					child.visible = true;
					subGroupHighlighted = subGroup;
				}
				else
				{
					child.material = zeroDensityMaterial;
				}
			}
		});
		$("li:contains(" + subGroup + ").title").css("text-decoration", "underline").css("color", "#FF6600");
	}
};

var clearSubgroup = function()
{
	if (subGroupHighlighted != "")
	{
		$("li:contains(" + subGroupHighlighted + ").title").css("text-decoration", "none").css("color", "#ffffff");
		;
		GEPPETTO.getScene().traverse(function(child)
		{
			if (child.hasOwnProperty("segment_groups"))
			{
				if (child.segment_groups.indexOf("soma_group") != -1)
				{
					child.material = somaMaterial;
				}
				else if (child.segment_groups.indexOf("axon_group") != -1)
				{
					child.material = axonMaterial;
				}
				else if (child.segment_groups.indexOf("dendrite_group") != -1)
				{
					child.material = dendriteMaterial;
				}
			}
		});
		subGroupHighlighted = "";
	}
};

var preprocessMetadata = function(data)
{
	for (d in data.entities)
	{
		var m = data.entities[d];
		if (m.metadata == null)
		{
			m.metadata =
			{};
		}
		var mcon = m.metadata["Connections"] =
		{};
		for (r in m.references)
		{
			var connectionType = m.references[r].metadata["Connection Type"];
			delete m.references[r].metadata["Connection Type"];
			if (!mcon[connectionType])
			{
				mcon[connectionType] =
				{};
			}
			mcon[connectionType][m.references[r].entityId] = m.references[r].metadata;

		}

	}
};

// disabling intersection check, to have decent performance it has to be too slow
// and it feels buggy, removing the functionality altogether as it's not necessary.
var checkIntersectionPeriod = -1;
var update = function()
{
	// if we are in selection mode (Z) checks for intersections
	if (TOGGLE_Z && SELECTED.length == 0 && !singleEntity())
	{
		if (checkIntersectionPeriod == 0)
		{
			var intersects = GEPPETTO.getIntersectedObjects();
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

					GEPPETTO.showMetadataForEntity(INTERSECTED.eindex);
				}
			}
			else
			// there are no intersections
			{
				deselectSelection();
			}

		}
		// checkIntersectionPeriod++;
		if (checkIntersectionPeriod > 25) // the higher the smaller the frequency
		{
			checkIntersectionPeriod = 0;
		}
	}

};

function deselectSelection()
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

var TOGGLE_N = true;
var TOGGLE_Z = false;
var TOGGLE_R = false;
var TOGGLE_S = false;
var TOGGLE_I = true;
var TOGGLE_O = true;
var TOGGLE_H = false;
var subGroupHighlighted = "";

function toggleHelp()
{
	TOGGLE_H = !TOGGLE_H;
	$("#help").modal('toggle');
}

function toggleRotationMode()
{
	if (TOGGLE_R)
	{
		TOGGLE_R = false;
		GEPPETTO.exitRotationMode();
	}
	else
	{
		TOGGLE_R = true;
		GEPPETTO.enterRotationMode(SELECTED);
	}
}

function toggleOutputs()
{
	TOGGLE_O = !TOGGLE_O;
	for (o in OUTPUT)
	{
		inputAndEnabled = TOGGLE_I && GEPPETTO.isIn(OUTPUT[o], INPUT);
		if (TOGGLE_S)
		{
			OUTPUT[o].visible = TOGGLE_O || inputAndEnabled;
		}
		else
		{
			OUTPUT[o].visible = true;
		}
		if (inputAndEnabled)
		{
			OUTPUT[o].material = prePostConnectedMaterial;
		}
		else if (TOGGLE_O)
		{
			OUTPUT[o].material = postConnectedMaterial;
		}
		else
		{
			OUTPUT[o].material = standardMaterial;
		}
	}

}

function toggleInputs()
{
	TOGGLE_I = !TOGGLE_I;
	for (i in INPUT)
	{
		outputAndEnabled = TOGGLE_O && GEPPETTO.isIn(INPUT[i], OUTPUT);
		if (TOGGLE_S)
		{
			INPUT[i].visible = TOGGLE_I || outputAndEnabled;
		}
		else
		{
			INPUT[i].visible = true;
		}
		if (outputAndEnabled)
		{
			INPUT[i].material = prePostConnectedMaterial;
		}
		else if (TOGGLE_I)
		{
			INPUT[i].material = preConnectedMaterial;
		}
		else
		{
			INPUT[i].material = standardMaterial;
		}
	}
}

function toggleNormalMode()
{
	if (!TOGGLE_N)
	{
		TOGGLE_Z = false;
		TOGGLE_N = true;
		GEPPETTO.removeMouseClickListener();
		GEPPETTO.removeGUI();
		if (SELECTED.length > 0)
		{
			// if anything was selected we merge the geometries again
			GEPPETTO.mergeEntities(SELECTED);
			SELECTED = [];
			REFERENCED = [];
		}
		GEPPETTO.metadata =
		{};
		GEPPETTO.setBackground(0xffffff, 1);
		GEPPETTO.getScene().traverse(function(child)
		{
			if (child.hasOwnProperty("material"))
			{
				var material = new THREE.MeshPhongMaterial(
				{
					opacity : 1,
					ambient : 0x777777,
					specular : 0xbbbb9b,
					shininess : 50,
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
		GEPPETTO.setBackground(0x000000, 1);

		if (singleEntity())
		{
			GEPPETTO.getScene().traverse(function(child)
			{
				if (child.hasOwnProperty("eid") && child.eid == GEPPETTO.getJSONScene().entities[0].id)
				{
					SELECTED = GEPPETTO.divideEntity(child);
					child.material.dispose();

					for (s in SELECTED)
					{
						if (SELECTED[s].segment_groups.indexOf("soma_group;") != -1)
						{
							SELECTED[s].material = somaMaterial;
						}
						else if (SELECTED[s].segment_groups.indexOf("axon_group;") != -1)
						{
							SELECTED[s].material = axonMaterial;
						}
						else if (SELECTED[s].segment_groups.indexOf("dendrite_group;") != -1)
						{
							SELECTED[s].material = dendriteMaterial;
						}
					}
					GEPPETTO.showMetadataForEntity(0);
					
					$("span:contains('Highlight')").prepend("<icon class='icon-screenshot'></icon> ");
					$("span:contains('Highlight')").addClass("highlight");
					
					$("li:contains('Ion Channels').title").append(" <icon class='icon-exchange'></icon>");
					$("li:contains('Connections').title").append(" <icon class='icon-signin'></icon> <icon class='icon-signout'></icon>");
				}
			});
		}
		else
		{

			GEPPETTO.setMouseClickListener(onClick);

			GEPPETTO.getScene().traverse(function(child)
			{
				if (child.hasOwnProperty("material"))
				{
					child.material.dispose();
					child.material = standardMaterial;
				}
			});
		}
	}
	;
}

function toggleHideDeselected()
{
	if (!TOGGLE_N && SELECTED.length > 0)
	{
		TOGGLE_S = !TOGGLE_S;
		GEPPETTO.getScene().traverse(function(child)
		{
			if (child.hasOwnProperty("material"))
			{
				if (!GEPPETTO.isIn(child, SELECTED))
				{
					if (GEPPETTO.isIn(child, INPUT))
					{
						if (!TOGGLE_I)
						{
							child.visible = !child.visible;
						}
						return;

					}
					if (GEPPETTO.isIn(child, OUTPUT))
					{
						if (!TOGGLE_O)
						{
							child.visible = !child.visible;
						}
						return;
					}
					child.visible = !child.visible;
				}

			}
		});
	}
}

function switchButton(id, status)
{
	if (status)
	{
		$('#' + id).addClass("active");
	}
	else
	{
		$('#' + id).removeClass("active");
	}
}

function keyPressed()
{
	// R enters rotation mode
	if (GEPPETTO.isKeyPressed("r"))
	{
		toggleRotationMode();
		switchButton("rotationMode", TOGGLE_R);
	}
	// I shows/hides inputs
	if (GEPPETTO.isKeyPressed("i"))
	{
		toggleInputs();
		switchButton("showinputs", TOGGLE_I);
	}
	// O shows/hides outputs
	if (GEPPETTO.isKeyPressed("o"))
	{
		toggleOutputs();
		switchButton("showoutputs", TOGGLE_O);
	}
	// Z enters selection mode
	if (GEPPETTO.isKeyPressed("z"))
	{
		toggleSelectionMode();
		switchButton("selectionMode", TOGGLE_Z);
		switchButton("normalMode", TOGGLE_N);
	}
	// N exits selection mode and switches to standard view
	if (GEPPETTO.isKeyPressed("n") && !TOGGLE_N)
	{
		toggleNormalMode();
		switchButton("normalMode", TOGGLE_N);
		switchButton("selectionMode", TOGGLE_Z);
	}
	// H exits selection mode and switches to standard view
	if (GEPPETTO.isKeyPressed("h"))
	{
		toggleHelp();
		switchButton("helpbutton", TOGGLE_H);
	}
	// S hides the non selected entities
	if (GEPPETTO.isKeyPressed("s"))
	{
		toggleHideDeselected();
		switchButton("showdeselected", TOGGLE_S);
	}
	// if (GEPPETTO.isKeyPressed("w"))
	// {
	// window.open(GEPPETTO.renderer.domElement.toDataURL('image/png'), 'screenshot');
	// }

}

function rotate(axis, delta)
{
	GEPPETTO.camera.rotation[axis] = GEPPETTO.camera.rotation[axis] + delta;
}

function translate(axis, delta)
{
	GEPPETTO.camera.position[axis] = GEPPETTO.camera.position[axis] + delta;
}

function setupUI()
{
	$(function()
	{

		$("#w").click(function(event)
		{
			GEPPETTO.controls.incrementPanEnd(-0.01, 0);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.controls.incrementPanEnd(0, -0.01);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.controls.incrementPanEnd(0.01, 0);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.controls.incrementPanEnd(0, 0.01);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.setupCamera();
			GEPPETTO.setupControls();
		});

		$("#rw").click(function(event)
		{
			GEPPETTO.controls.incrementRotationEnd(-0.01, 0, 0);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.controls.incrementRotationEnd(0, 0, 0.01);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.controls.incrementRotationEnd(0.01, 0, 0);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.controls.incrementRotationEnd(0, 0, -0.01);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		}).next().click(function(event)
		{
			GEPPETTO.setupCamera();
			GEPPETTO.setupControls();
		});

		$("#showdeselected").click(function(event)
		{
			toggleHideDeselected();
		});

		$("#showinputs").click(function(event)
		{
			toggleInputs();
		});

		$("#showoutputs").click(function(event)
		{
			toggleOutputs();
		});

		$("#rotationMode").click(function(event)
		{
			toggleRotationMode();
		});

		$("#normalMode").click(function(event)
		{
			toggleNormalMode();
		});
		$("#selectionMode").click(function(event)
		{
			toggleSelectionMode();
		});

		$("#zo").click(function(event)
		{
			GEPPETTO.controls.incrementZoomEnd(+0.01);

		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		});

		$("#zi").click(function(event)
		{
			GEPPETTO.controls.incrementZoomEnd(-0.01);
		}).mouseup(function(event)
		{
			GEPPETTO.controls.resetSTATE();
		});

	});

}

function singleEntity()
{
	return GEPPETTO.getJSONScene().entities.length == 1;
}

function getUrlVars()
{
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for ( var i = 0; i < hashes.length; i++)
	{
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}
