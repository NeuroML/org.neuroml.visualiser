/**
 * 
 */
package org.neuroml.visualiser.core;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.neuroml.model.Cell;
import org.neuroml.model.Morphology;
import org.neuroml.model.Neuroml;
import org.neuroml.model.Point3DWithDiam;
import org.neuroml.model.Segment;
import org.neuroml.visualiser.model.AGeometry;
import org.neuroml.visualiser.model.Cylinder;
import org.neuroml.visualiser.model.Entity;
import org.neuroml.visualiser.model.Metadata;
import org.neuroml.visualiser.model.Point;
import org.neuroml.visualiser.model.Scene;
import org.neuroml.visualiser.model.Sphere;

/**
 * @author matteocantarelli
 * 
 */
public class MorphologyConverter
{

	public Scene getSceneFromNeuroML(List<Neuroml> neuromls)
	{
		Scene scene = new Scene();
		for (Neuroml neuroml : neuromls)
		{
			List<Morphology> morphologies = neuroml.getMorphology();
			if (morphologies != null)
			{
				for (Morphology m : morphologies)
				{
					Entity entity = getEntityFromMorphology(m);
					scene.getEntities().add(entity);
				}
			}
			List<Cell> cells = neuroml.getCell();
			if (cells != null)
			{
				for (Cell c : cells)
				{
					Morphology cellmorphology = c.getMorphology();
					if (cellmorphology != null)
					{
						Entity entity = getEntityFromMorphology(cellmorphology);
						augmentWithMetaData(entity, c);
						scene.getEntities().add(entity);
					}
				}
			}
		}
		return scene;
	}

	private void augmentWithMetaData(Entity entity, Cell c)
	{
		try
		{
			Metadata membraneProperties = new Metadata();
			membraneProperties.setAdditionalProperties("Condunctance density", c.getBiophysicalProperties().getMembraneProperties().getChannelDensity().get(0).getCondDensity());
			membraneProperties.setAdditionalProperties("Spike Threshold", c.getBiophysicalProperties().getMembraneProperties().getSpikeThresh().get(0).getValue());
			membraneProperties.setAdditionalProperties("Specific Capacitance", c.getBiophysicalProperties().getMembraneProperties().getSpecificCapacitance().get(0).getValue());
			membraneProperties.setAdditionalProperties("Initial Membrane Potential", c.getBiophysicalProperties().getMembraneProperties().getInitMembPotential().get(0).getValue());

			Metadata intracellularProperties = new Metadata();
			intracellularProperties.setAdditionalProperties("Resistivity", c.getBiophysicalProperties().getIntracellularProperties().getResistivity().get(0).getValue());

			entity.setMetadata(new Metadata());
			entity.getMetadata().setAdditionalProperties("ID", c.getId());
			entity.getMetadata().setAdditionalProperties("Membrane Properties", membraneProperties);
			entity.getMetadata().setAdditionalProperties("Intracellular Properties", intracellularProperties);
		}
		catch (NullPointerException ex)
		{

		}
	}

	private Entity getEntityFromMorphology(Morphology morphology)
	{
		Entity entity = new Entity();
		Map<String, Point3DWithDiam> distalPoints = new HashMap<String, Point3DWithDiam>();
		for (Segment s : morphology.getSegment())
		{
			String idSegmentParent = null;
			Point3DWithDiam parentDistal = null;
			if (s.getParent() != null)
			{
				idSegmentParent = s.getParent().getSegment().toString();
			}
			if (distalPoints.containsKey(idSegmentParent))
			{
				parentDistal = distalPoints.get(idSegmentParent);
			}
			entity.getGeometries().add(getCylinderFromSegment(s, parentDistal));
			distalPoints.put(s.getId(), s.getDistal());
		}
		return entity;
	}

	private boolean samePoint(Point3DWithDiam p1, Point3DWithDiam p2)
	{
		return p1.getX() == p2.getX() && p1.getY() == p2.getY() && p1.getZ() == p2.getZ() && p1.getDiameter() == p2.getDiameter();
	}

	private AGeometry getCylinderFromSegment(Segment s, Point3DWithDiam parentDistal)
	{

		Point3DWithDiam proximal = s.getProximal() == null ? parentDistal : s.getProximal();
		Point3DWithDiam distal = s.getDistal();

		if (samePoint(proximal, distal)) // ideally an equals but the objects
											// are generated. hassle postponed.
		{
			Sphere sphere = new Sphere();
			sphere.setRadius(proximal.getDiameter() / 2);
			sphere.setPosition(getPoint(proximal));
			return sphere;
		}
		else
		{
			Cylinder cyl = new Cylinder();

			if (proximal != null)
			{
				cyl.setPosition(getPoint(proximal));
				cyl.setRadiusBottom(proximal.getDiameter() / 2);
			}

			if (distal != null)
			{
				cyl.setRadiusTop(s.getDistal().getDiameter() / 2);
				cyl.setA1(0d);
				cyl.setA2(0d);
				cyl.setDistal(getPoint(distal));
				cyl.setHeight(0d);
			}
			return cyl;
		}

	}

	private Point getPoint(Point3DWithDiam distal)
	{
		Point point = new Point();
		point.setX(distal.getX());
		point.setY(distal.getY());
		point.setZ(distal.getZ());
		return point;
	}
}
