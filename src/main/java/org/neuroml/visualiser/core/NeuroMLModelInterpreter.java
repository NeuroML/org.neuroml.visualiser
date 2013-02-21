/**
 * 
 */
package org.neuroml.visualiser.core;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.neuroml.model.Cell;
import org.neuroml.model.Include;
import org.neuroml.model.Member;
import org.neuroml.model.Morphology;
import org.neuroml.model.Network;
import org.neuroml.model.Point3DWithDiam;
import org.neuroml.model.Population;
import org.neuroml.model.NeuroMLDocument;
import org.neuroml.model.Segment;
import org.neuroml.model.SegmentGroup;
import org.neuroml.model.SynapticConnection;
import org.neuroml.model.util.NeuroMLConverter;
import org.openworm.simulationengine.core.visualisation.model.AGeometry;
import org.openworm.simulationengine.core.visualisation.model.Cylinder;
import org.openworm.simulationengine.core.visualisation.model.Entity;
import org.openworm.simulationengine.core.visualisation.model.Metadata;
import org.openworm.simulationengine.core.visualisation.model.Point;
import org.openworm.simulationengine.core.visualisation.model.Reference;
import org.openworm.simulationengine.core.visualisation.model.Scene;
import org.openworm.simulationengine.core.visualisation.model.Sphere;

/**
 * @author matteocantarelli
 * 
 */
public class NeuroMLModelInterpreter
{

	private NeuroMLConverter _neuromlConverter = null;
	private static final String GROUP_PROPERTY = "group";

	// neuroml hardcoded concepts
	private static final String DENDRITE_GROUP = "dendrite_group";
	private static final String AXON_GROUP = "axon_group";
	private static final String SOMA_GROUP = "soma_group";

	/**
	 * 
	 */
	public NeuroMLModelInterpreter()
	{
		super();
		try
		{
			_neuromlConverter = new NeuroMLConverter();
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
	}

	/**
	 * @param neuromls
	 * @return
	 */
	public Scene getSceneFromNeuroML(List<URL> neuromlURLs)
 	{		Scene scene = new Scene();
		for (URL url : neuromlURLs)
		{
			NeuroMLDocument neuroml;
			try
			{
				neuroml = _neuromlConverter.urlToNeuroML(url);
				scene.getEntities().addAll(getEntitiesFromMorphologies(neuroml)); // if there's any morphology
				scene.getEntities().addAll(getEntitiesFromNetwork(neuroml, url)); // if a population is described -> network
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		return scene;
	}

	/**
	 * @param neuroml
	 * @return
	 */
	public List<Entity> getEntitiesFromMorphologies(NeuroMLDocument neuroml)
	{
		List<Entity> entities = new ArrayList<Entity>();
		List<Morphology> morphologies = neuroml.getMorphology();
		if (morphologies != null)
		{
			for (Morphology m : morphologies)
			{
				Entity entity = getEntityFromMorphology(m);
				entities.add(entity);
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
					Entity cell = new Entity();
					cell.setSubentities(getEntitiesFromMorphologyBySegmentGroup(cellmorphology, c.getId()));
					cell.setId(c.getId());
					augmentWithMetaData(cell, c);
					entities.add(cell);
				}
			}
		}
		return entities;
	}

	/**
	 * @param neuroml
	 * @param scene
	 * @param url
	 * @throws Exception
	 */
	private Collection<Entity> getEntitiesFromNetwork(NeuroMLDocument neuroml, URL url) throws Exception
	{
		Map<String, Entity> entities = new HashMap<String, Entity>();
		String baseURL = url.getFile();
		if (url.getFile().endsWith("nml"))
		{
			baseURL = baseURL.substring(0, baseURL.lastIndexOf("/") + 1);
		}
		List<Network> networks = neuroml.getNetwork();
		for (Network n : networks)
		{
			for (Population p : n.getPopulation())
			{
				NeuroMLDocument neuromlComponent = null;
				String component = p.getComponent();
				try
				{
					URL componentURL = new URL(url.getProtocol() + "://" + url.getAuthority() + baseURL + component + ".nml");
					neuromlComponent = _neuromlConverter.urlToNeuroML(componentURL);

				}
				catch (MalformedURLException e)
				{
					e.printStackTrace();
				}
				catch (Exception e)
				{
					e.printStackTrace();
				}

				int size = p.getSize().intValue();

				for (int i = 0; i < size; i++)
				{
					// FIXME the position of the population within the network needs to be specified in neuroml
					List<Entity> localEntities = getEntitiesFromMorphologies(neuromlComponent);
					for (Entity e : localEntities)
					{
						e.setId(e.getId() + "[" + i + "]");
						entities.put(e.getId(), e);
					}
				}
				// FIXME what's the purpose of the id here?
				String id = p.getId();

			}
			for (SynapticConnection c : n.getSynapticConnection())
			{
				String from = c.getFrom();
				String to = c.getTo();

				Metadata mPost = new Metadata();
				mPost.setAdditionalProperties(Resources.SYNAPSE.get(), c.getSynapse());
				mPost.setAdditionalProperties(Resources.CONNECTION_TYPE.get(), Resources.POST_SYNAPTIC.get());
				Reference rPost = new Reference();
				rPost.setEntityId(to);
				rPost.setMetadata(mPost);

				Metadata mPre = new Metadata();
				mPre.setAdditionalProperties(Resources.SYNAPSE.get(), c.getSynapse());
				mPre.setAdditionalProperties(Resources.CONNECTION_TYPE.get(), Resources.PRE_SYNAPTIC.get());
				Reference rPre = new Reference();
				rPre.setEntityId(from);
				rPre.setMetadata(mPre);

				if (entities.containsKey(from))
				{
					entities.get(from).getReferences().add(rPost);
				}
				else
				{
					throw new Exception("Reference not found." + from + " was not found in the path of the network file");
				}

				if (entities.containsKey(to))
				{
					entities.get(to).getReferences().add(rPre);
				}
				else
				{
					throw new Exception("Reference not found." + to + " was not found in the path of the network file");
				}
			}
		}
		return entities.values();
	}

	/**
	 * @param entity
	 * @param c
	 */
	private void augmentWithMetaData(Entity entity, Cell c)
	{
		try
		{
			if(c.getBiophysicalProperties()!=null)
			{
				Metadata membraneProperties = new Metadata();
				if(c.getBiophysicalProperties().getMembraneProperties()!=null)
				{
					if(c.getBiophysicalProperties().getMembraneProperties().getChannelDensity()!=null && c.getBiophysicalProperties().getMembraneProperties().getChannelDensity().size()>0)
					{
						membraneProperties.setAdditionalProperties(Resources.COND_DENSITY.get(), c.getBiophysicalProperties().getMembraneProperties().getChannelDensity().get(0).getCondDensity());
					}
					if(c.getBiophysicalProperties().getMembraneProperties().getSpikeThresh()!=null && c.getBiophysicalProperties().getMembraneProperties().getSpikeThresh().size()>0)
					{
						membraneProperties.setAdditionalProperties(Resources.SPIKE_THRESHOLD.get(), c.getBiophysicalProperties().getMembraneProperties().getSpikeThresh().get(0).getValue());
					}
					if(c.getBiophysicalProperties().getMembraneProperties().getSpecificCapacitance()!=null && c.getBiophysicalProperties().getMembraneProperties().getSpecificCapacitance().size()>0)
					{
						membraneProperties.setAdditionalProperties(Resources.SPECIFIC_CAPACITANCE.get(), c.getBiophysicalProperties().getMembraneProperties().getSpecificCapacitance().get(0).getValue());
					}
					if(c.getBiophysicalProperties().getMembraneProperties().getInitMembPotential()!=null && c.getBiophysicalProperties().getMembraneProperties().getInitMembPotential().size()>0)
					{
						membraneProperties.setAdditionalProperties(Resources.INIT_MEMBRANE_POTENTIAL.get(), c.getBiophysicalProperties().getMembraneProperties().getInitMembPotential().get(0).getValue());
					}
					
				}

	
				Metadata intracellularProperties = new Metadata();
				if(c.getBiophysicalProperties().getIntracellularProperties()!=null)
				{
					if(c.getBiophysicalProperties().getIntracellularProperties().getResistivity()!=null && c.getBiophysicalProperties().getIntracellularProperties().getResistivity().size()>0)
					{
						intracellularProperties.setAdditionalProperties(Resources.RESISTIVITY.get(), c.getBiophysicalProperties().getIntracellularProperties().getResistivity().get(0).getValue());
					}
				}
				
	
				// Sample code to add URL metadata
				// Metadata externalResources = new Metadata();
				// externalResources.setAdditionalProperties("Worm Atlas", "URL:http://www.wormatlas.org/neurons/Individual%20Neurons/PVDmainframe.htm");
				// externalResources.setAdditionalProperties("WormBase", "URL:https://www.wormbase.org/tools/tree/run?name=PVDR;class=Cell");
	
				entity.setMetadata(new Metadata());
				entity.getMetadata().setAdditionalProperties(Resources.MEMBRANE_P.get(), membraneProperties);
				entity.getMetadata().setAdditionalProperties(Resources.INTRACELLULAR_P.get(), intracellularProperties);
				// entity.getMetadata().setAdditionalProperties("External Resources", externalResources);
			}
		}
		catch (NullPointerException ex)
		{

		}
	}

	/**
	 * @param morphology
	 * @return
	 */
	private Entity getEntityFromMorphology(Morphology morphology)
	{
		return getEntityFromListOfSegments(morphology.getSegment());
	}

	/**
	 * @param morphology
	 * @param cellId
	 * @return
	 */
	private List<Entity> getEntitiesFromMorphologyBySegmentGroup(Morphology morphology, String cellId)
	{
		Entity allSegments = getEntityFromListOfSegments(morphology.getSegment());
		List<Entity> entities = new ArrayList<Entity>();
		Map<String, List<AGeometry>> segmentGeometries = new HashMap<String, List<AGeometry>>();
		SegmentGroup somaGroup = null;
		SegmentGroup axonGroup = null;
		SegmentGroup dendriteGroup = null;

		for (SegmentGroup sg : morphology.getSegmentGroup())
		{
			// three hardcoded groups :(
			if (sg.getId().equals(SOMA_GROUP))
			{
				somaGroup = sg;
			}
			else if (sg.getId().equals(AXON_GROUP))
			{
				axonGroup = sg;
			}
			else if (sg.getId().equals(DENDRITE_GROUP))
			{
				dendriteGroup = sg;
			}
			else
			{
				if (!sg.getMember().isEmpty())
				{
					segmentGeometries.put(sg.getId(), getGeometriesForGroup(sg, allSegments));
				}
			}
		}

		if (somaGroup != null)
		{
			Entity entity = createEntityForMacroGroup(somaGroup, segmentGeometries);
			entity.setId(getGroupId(cellId, somaGroup.getId()));
			entities.add(entity);
		}
		if (axonGroup != null)
		{
			Entity entity = createEntityForMacroGroup(axonGroup, segmentGeometries);
			entity.setId(getGroupId(cellId, axonGroup.getId()));
			entities.add(entity);
		}
		if (dendriteGroup != null)
		{
			Entity entity = createEntityForMacroGroup(dendriteGroup, segmentGeometries);
			entity.setId(getGroupId(cellId, dendriteGroup.getId()));
			entities.add(entity);
		}

		// this adds all segment groups not contained in the macro groups if any
		for (String sgId : segmentGeometries.keySet())
		{
			Entity entity = new Entity();
			entity.getGeometries().addAll(segmentGeometries.get(sgId));
			entity.setAdditionalProperties(GROUP_PROPERTY, sgId);
			entity.setId(getGroupId(cellId, sgId));
			entities.add(entity);
		}
		return entities;
	}

	/**
	 * @param cellId
	 * @param segmentGroupId
	 * @return
	 */
	private String getGroupId(String cellId, String segmentGroupId)
	{
		return cellId + " " + segmentGroupId;
	}

	/**
	 * @param somaGroup
	 * @param segmentGeometries
	 */
	private Entity createEntityForMacroGroup(SegmentGroup macroGroup, Map<String, List<AGeometry>> segmentGeometries)
	{
		Entity entity = new Entity();
		entity.setAdditionalProperties(GROUP_PROPERTY, macroGroup.getId());
		for (Include i : macroGroup.getInclude())
		{
			if(segmentGeometries.containsKey(i.getSegmentGroup()))
			{
				entity.getGeometries().addAll(segmentGeometries.get(i.getSegmentGroup()));
				segmentGeometries.remove(i.getSegmentGroup());
			}
		}
		return entity;
	}

	/**
	 * @param sg
	 * @param allSegments
	 * @return
	 */
	private List<AGeometry> getGeometriesForGroup(SegmentGroup sg, Entity allSegments)
	{
		List<AGeometry> geometries = new ArrayList<AGeometry>();
		for (Member m : sg.getMember())
		{
			for (AGeometry g : allSegments.getGeometries())
			{
				if (g.getId().equals(m.getSegment().toString()))
				{
					geometries.add(g);
				}
			}
		}
		return geometries;
	}

	/**
	 * @param list
	 * @return
	 */
	private Entity getEntityFromListOfSegments(List<Segment> list)
	{
		Entity entity = new Entity();
		Map<String, Point3DWithDiam> distalPoints = new HashMap<String, Point3DWithDiam>();
		for (Segment s : list)
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

	/**
	 * @param p1
	 * @param p2
	 * @return
	 */
	private boolean samePoint(Point3DWithDiam p1, Point3DWithDiam p2)
	{
		return p1.getX() == p2.getX() && p1.getY() == p2.getY() && p1.getZ() == p2.getZ() && p1.getDiameter() == p2.getDiameter();
	}

	/**
	 * @param s
	 * @param parentDistal
	 * @return
	 */
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
			sphere.setId(s.getId());
			return sphere;
		}
		else
		{
			Cylinder cyl = new Cylinder();
			cyl.setId(s.getId());
			if (proximal != null)
			{
				cyl.setPosition(getPoint(proximal));
				cyl.setRadiusBottom(proximal.getDiameter() / 2);
			}

			if (distal != null)
			{
				cyl.setRadiusTop(s.getDistal().getDiameter() / 2);
				cyl.setDistal(getPoint(distal));
				cyl.setHeight(0d);
			}
			return cyl;
		}

	}

	/**
	 * @param distal
	 * @return
	 */
	private Point getPoint(Point3DWithDiam distal)
	{
		Point point = new Point();
		point.setX(distal.getX());
		point.setY(distal.getY());
		point.setZ(distal.getZ());
		return point;
	}

}
