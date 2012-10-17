/**
 * 
 */
package org.neuroml.visualiser.core;

import java.util.List;

import org.neuroml.model.Cell;
import org.neuroml.model.Morphology;
import org.neuroml.model.Neuroml;
import org.neuroml.model.Point3DWithDiam;
import org.neuroml.model.Segment;
import org.neuroml.visualiser.model.MorphologyProtos.Cylinder;
import org.neuroml.visualiser.model.MorphologyProtos.Entity;
import org.neuroml.visualiser.model.MorphologyProtos.Geometry;
import org.neuroml.visualiser.model.MorphologyProtos.Geometry.Type;
import org.neuroml.visualiser.model.MorphologyProtos.Point;
import org.neuroml.visualiser.model.MorphologyProtos.Scene;

/**
 * @author matteocantarelli
 * 
 */
public class MorphologyConverter {

	public Scene getSceneFromNeuroML(Neuroml neuroML) {
		Scene.Builder sceneB = Scene.newBuilder();
		List<Morphology> morphologies = neuroML.getMorphology();
		if (morphologies != null) {
			for (Morphology m : morphologies) {
				sceneB.addEntity(getEntityFromMorphology(m));
			}
		}
		List<Cell> cells = neuroML.getCell();
		if (cells != null) {
			for (Cell c : cells) {
				Morphology cellmorphology = c.getMorphology();
				if (cellmorphology != null) {
					sceneB.addEntity(getEntityFromMorphology(cellmorphology));
				}
			}
		}
		return sceneB.build();
	}

	private Entity getEntityFromMorphology(Morphology morphology) {
		Entity.Builder entityB = Entity.newBuilder();
		for (Segment s : morphology.getSegment()) {
			entityB.addGeometry(getCylinderFromSegment(s));
		}
		return entityB.build();
	}

	private Geometry getCylinderFromSegment(Segment s) {
		Geometry.Builder geometryP = Geometry.newBuilder();
		geometryP.setType(Type.Cylinder);

		Cylinder.Builder cylB = Cylinder.newBuilder();
		if (s.getDistal() != null) {
			cylB.setDistal(getPoint(s.getDistal()));
			cylB.setRadiusBottom(s.getDistal().getDiameter() / 2);
		} else {
			cylB.setDistal(Point.newBuilder().setX(0d).setY(0d).setZ(0d).build());
			cylB.setRadiusBottom(0d);
		}
		if (s.getProximal() != null) {
			cylB.setRadiusTop(s.getProximal().getDiameter() / 2);
		} else {
			cylB.setRadiusTop(0d);

		}
		cylB.setA1(0f);
		cylB.setA2(0f);
		cylB.setHeight(10);
		geometryP.setExtension(Cylinder.geometry, cylB.build());

		return geometryP.build();
	}

	private Point getPoint(Point3DWithDiam distal) {
		Point.Builder pointB = Point.newBuilder();
		pointB.setX(distal.getX());
		pointB.setY(distal.getY());
		pointB.setZ(distal.getZ());
		return pointB.build();
	}
}
